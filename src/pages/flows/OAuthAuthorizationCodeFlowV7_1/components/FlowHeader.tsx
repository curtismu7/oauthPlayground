// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowHeader.tsx
// V7.1 Flow Header - Header component with variant selector and flow information

import { FiChevronDown, FiInfo } from '@icons';
import React from 'react';
import styled from 'styled-components';
import { UI_CONSTANTS } from '../constants/uiConstants';
import type { FlowVariant } from '../types/flowTypes';
import { V9_COLORS } from '../../../../services/v9/V9ColorStandards';

interface FlowHeaderProps {
	flowVariant: FlowVariant;
	onVariantChange: (variant: FlowVariant) => void;
	currentStep: number;
	totalSteps: number;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	flowName?: string;
	showVariantSelector?: boolean;
}

const HeaderContainer = styled.div<{ $variant: FlowVariant }>`
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: V9_COLORS.TEXT.WHITE;
  padding: ${UI_CONSTANTS.HEADER.PADDING};
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: ${UI_CONSTANTS.HEADER.BORDER_RADIUS};
  font-weight: ${UI_CONSTANTS.HEADER.FONT_WEIGHT};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.LG};
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.MD};
`;

const FlowIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 1.5rem;
`;

const FlowInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.XS};
`;

const FlowTitle = styled.h1`
  margin: 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['2XL']};
  font-weight: ${UI_CONSTANTS.HEADER.TITLE_FONT_WEIGHT};
  color: V9_COLORS.TEXT.WHITE;
`;

const FlowSubtitle = styled.p`
  margin: 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  color: rgba(255, 255, 255, 0.85);
  opacity: 0.9;
`;

const VersionBadge = styled.span<{ $variant: FlowVariant }>`
  display: inline-flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.XS};
  background: rgba(249, 115, 22, 0.2);
  border: 1px solid #fb923c;
  color: #fb923c;
  font-size: ${UI_CONSTANTS.HEADER.VERSION_BADGE_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.HEADER.VERSION_BADGE_FONT_WEIGHT};
  letter-spacing: ${UI_CONSTANTS.HEADER.VERSION_BADGE_LETTER_SPACING};
  padding: ${UI_CONSTANTS.HEADER.VERSION_BADGE_PADDING};
  border-radius: ${UI_CONSTANTS.HEADER.VERSION_BADGE_BORDER_RADIUS};
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: ${UI_CONSTANTS.TYPOGRAPHY.LETTER_SPACING.TIGHT};
`;

const CollapseButton = styled.button<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: V9_COLORS.TEXT.WHITE;
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
  }
  
  &:active {
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_ACTIVE};
  }
  
  svg {
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  }
`;

const VariantSelector = styled.div`
  display: flex;
  gap: ${UI_CONSTANTS.SPACING.MD};
  margin-top: ${UI_CONSTANTS.SPACING.LG};
`;

const VariantButton = styled.button<{ $selected: boolean; $variant: FlowVariant }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${UI_CONSTANTS.SPACING.XS};
  padding: ${UI_CONSTANTS.SPACING.LG};
  border: 2px solid ${(props) => (props.$selected ? 'V9_COLORS.PRIMARY.BLUE' : '#cbd5e1')};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  background: ${(props) => (props.$selected ? 'V9_COLORS.BG.GRAY_LIGHT' : 'V9_COLORS.TEXT.WHITE')};
  color: ${(props) => (props.$selected ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'V9_COLORS.TEXT.GRAY_MEDIUM')};
  font-weight: ${(props) => (props.$selected ? '600' : '500')};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  text-align: left;
  min-width: 200px;
  
  &:hover {
    border-color: V9_COLORS.PRIMARY.BLUE;
    background: V9_COLORS.BG.GRAY_LIGHT;
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
  }
  
  &:active {
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_ACTIVE};
  }
`;

const VariantTitle = styled.div`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  font-weight: 600;
  margin-bottom: ${UI_CONSTANTS.SPACING.XS};
`;

const VariantDescription = styled.div`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  opacity: 0.8;
  color: V9_COLORS.PRIMARY.YELLOW_DARK;
`;

const InfoButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: V9_COLORS.TEXT.WHITE;
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
  }
`;

export const FlowHeader: React.FC<FlowHeaderProps> = ({
	flowVariant,
	onVariantChange,
	currentStep,
	totalSteps,
	isCollapsed,
	onToggleCollapse,
	flowName = 'OAuth Authorization Code Flow V7.1',
	showVariantSelector = true,
}) => {
	const getVariantConfig = (variant: FlowVariant) => {
		return {
			oauth: {
				name: 'OAuth 2.0',
				description: 'Access token only - API authorization',
				icon: '🔑',
			},
			oidc: {
				name: 'OpenID Connect',
				description: 'ID token + Access token - Authentication + Authorization',
				icon: '🆔',
			},
		}[variant];
	};

	const currentConfig = getVariantConfig(flowVariant);

	return (
		<div>
			<HeaderContainer $variant={flowVariant}>
				<HeaderLeft>
					<FlowIcon>{currentConfig.icon}</FlowIcon>
					<FlowInfo>
						<FlowTitle>{flowName}</FlowTitle>
						<FlowSubtitle>
							{currentConfig.name} - {currentConfig.description}
						</FlowSubtitle>
						<VersionBadge $variant={flowVariant}>7.1</VersionBadge>
					</FlowInfo>
				</HeaderLeft>

				<HeaderRight>
					<StepIndicator>
						Step {currentStep + 1} of {totalSteps}
					</StepIndicator>
					<InfoButton title="Flow Information">
						<FiInfo />
					</InfoButton>
					<CollapseButton
						$collapsed={isCollapsed}
						onClick={onToggleCollapse}
						title={isCollapsed ? 'Expand' : 'Collapse'}
					>
						<FiChevronDown />
					</CollapseButton>
				</HeaderRight>
			</HeaderContainer>

			{showVariantSelector && (
				<VariantSelector>
					<VariantButton
						$selected={flowVariant === 'oauth'}
						$variant="oauth"
						onClick={() => onVariantChange('oauth')}
					>
						<VariantTitle>OAuth 2.0 Authorization Code</VariantTitle>
						<VariantDescription>Access token only - API authorization</VariantDescription>
					</VariantButton>
					<VariantButton
						$selected={flowVariant === 'oidc'}
						$variant="oidc"
						onClick={() => onVariantChange('oidc')}
					>
						<VariantTitle>OpenID Connect Authorization Code</VariantTitle>
						<VariantDescription>
							ID token + Access token - Authentication + Authorization
						</VariantDescription>
					</VariantButton>
				</VariantSelector>
			)}
		</div>
	);
};

export default FlowHeader;
