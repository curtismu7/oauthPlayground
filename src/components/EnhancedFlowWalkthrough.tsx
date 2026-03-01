// src/components/EnhancedFlowWalkthrough.tsx
// Enhanced FlowWalkthrough component using the FlowWalkthroughService

import { FiChevronDown, FiGlobe } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import { FlowWalkthroughConfig, FlowWalkthroughService } from '../services/FlowWalkthroughService';

export interface EnhancedFlowWalkthroughProps {
	flowId: string;
	customConfig?: Partial<FlowWalkthroughConfig>;
	defaultCollapsed?: boolean;
	className?: string;
}

const Container = styled.div<{ $flowType: 'oauth' | 'oidc' | 'pingone' }>`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	margin-bottom: 2rem;
	overflow: hidden;
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}
`;

const Header = styled.div<{ $isCollapsible: boolean }>`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border-bottom: 1px solid #e2e8f0;
	padding: 1.5rem;
	cursor: ${({ $isCollapsible }) => ($isCollapsible ? 'pointer' : 'default')};
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
	}
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div<{ $flowType: 'oauth' | 'oidc' | 'pingone' }>`
	width: 2.5rem;
	height: 2.5rem;
	background: ${({ $flowType }) => {
		switch ($flowType) {
			case 'oauth':
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
			case 'oidc':
				return 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
			case 'pingone':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
		}
	}};
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.25rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`;

const ChevronButton = styled.button<{ $collapsed: boolean }>`
	width: 2rem;
	height: 2rem;
	background: #3b82f6;
	border: none;
	border-radius: 50%;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

	&:hover {
		background: #2563eb;
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(-90deg) scale(1.05)' : 'rotate(0deg) scale(1.05)'};
	}
`;

const Content = styled.div<{ $collapsed: boolean }>`
	padding: 1.5rem;
	background: #ffffff;
	display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
	animation: ${({ $collapsed }) => ($collapsed ? 'none' : 'slideDown 0.3s ease')};

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const StepsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const StepItem = styled.div<{ $flowType: 'oauth' | 'oidc' | 'pingone' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	transition: all 0.2s ease;
	position: relative;

	&:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	&:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 1.25rem;
		top: 3.5rem;
		width: 2px;
		height: 1rem;
		background: ${({ $flowType }) => {
			switch ($flowType) {
				case 'oauth':
					return 'linear-gradient(to bottom, #3b82f6, #cbd5e1)';
				case 'oidc':
					return 'linear-gradient(to bottom, #10b981, #cbd5e1)';
				case 'pingone':
					return 'linear-gradient(to bottom, #f59e0b, #cbd5e1)';
				default:
					return 'linear-gradient(to bottom, #6b7280, #cbd5e1)';
			}
		}};
	}
`;

const StepNumber = styled.div<{ $flowType: 'oauth' | 'oidc' | 'pingone' }>`
	width: 2.5rem;
	height: 2.5rem;
	background: ${({ $flowType }) => {
		switch ($flowType) {
			case 'oauth':
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
			case 'oidc':
				return 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
			case 'pingone':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #374151 100%)';
		}
	}};
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const StepContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const StepTitle = styled.div`
	font-size: 0.9375rem;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.4;
`;

const StepDescription = styled.div`
	font-size: 0.875rem;
	color: #64748b;
	line-height: 1.5;
`;

const ErrorMessage = styled.div`
	padding: 1rem;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 8px;
	color: #dc2626;
	font-size: 0.875rem;
`;

export const EnhancedFlowWalkthrough: React.FC<EnhancedFlowWalkthroughProps> = ({
	flowId,
	customConfig,
	defaultCollapsed = true,
	className,
}) => {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

	// Get configuration from service
	const baseConfig = FlowWalkthroughService.getWalkthroughConfig(flowId);

	if (!baseConfig) {
		return (
			<Container $flowType="oauth" className={className}>
				<ErrorMessage>No walkthrough configuration found for flow: {flowId}</ErrorMessage>
			</Container>
		);
	}

	// Merge with custom configuration
	const config: FlowWalkthroughConfig = {
		...baseConfig,
		...customConfig,
	};

	const toggleCollapsed = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<Container $flowType={config.flowType} className={className}>
			<Header $isCollapsible={true} onClick={toggleCollapsed}>
				<HeaderContent>
					<HeaderIcon $flowType={config.flowType}>
						{config.icon || <FiGlobe size={20} />}
					</HeaderIcon>
					<Title>{config.flowName} Walkthrough</Title>
				</HeaderContent>
				<ChevronButton $collapsed={isCollapsed}>
					<FiChevronDown size={16} />
				</ChevronButton>
			</Header>
			<Content $collapsed={isCollapsed}>
				<StepsContainer>
					{config.steps.map((step, index) => (
						<StepItem key={index} $flowType={config.flowType}>
							<StepNumber $flowType={config.flowType}>{index + 1}</StepNumber>
							<StepContent>
								<StepTitle>{step.title}</StepTitle>
								{step.description && <StepDescription>{step.description}</StepDescription>}
							</StepContent>
						</StepItem>
					))}
				</StepsContainer>
			</Content>
		</Container>
	);
};

export default EnhancedFlowWalkthrough;
