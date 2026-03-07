import {
	FiAlertTriangle,
	FiCheck,
	FiChevronDown,
	FiChevronRight,
	FiCopy,
	FiExternalLink,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import {
	flowRequiresRedirectUri,
	getCallbackDescription,
	getCallbackUrlForFlow,
} from '../utils/callbackUrls';
import { logger } from '../utils/logger';

const CallbackUrlContainer = styled.div`
  background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.BG.GRAY_LIGHT 50%, V9_COLORS.BG.GRAY_LIGHT 100%);
  border: 2px solid #0ea5e9;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(56, 189, 248, 0.05) 100%);
    border-radius: 0.75rem;
    pointer-events: none;
  }
`;

const CallbackUrlHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%) !important;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid V9_COLORS.PRIMARY.BLUE_DARK;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  position: relative;
  z-index: 1;
  
  &:hover {
    background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%) !important;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
    transform: translateY(-1px);
  }
`;

const CallbackUrlTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.WHITE;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ChevronIcon = styled.div`
  color: V9_COLORS.TEXT.WHITE;
  font-size: 1.25rem;
  transition: transform 0.2s ease;
`;

const CallbackUrlContent = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: ${({ $isExpanded }) => ($isExpanded ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  position: relative;
  z-index: 1;
`;

const UrlDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: V9_COLORS.TEXT.WHITE;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
`;

const UrlText = styled.code`
  flex: 1;
  color: V9_COLORS.TEXT.GRAY_DARK;
  word-break: break-all;
`;

const ActionButton = styled.button<{ $variant?: 'copy' | 'external' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid ${({ $variant }) => ($variant === 'copy' ? 'V9_COLORS.TEXT.GRAY_LIGHTER' : 'V9_COLORS.PRIMARY.BLUE')};
  border-radius: 0.375rem;
  background: ${({ $variant }) => ($variant === 'copy' ? 'V9_COLORS.TEXT.WHITE' : 'V9_COLORS.PRIMARY.BLUE')};
  color: ${({ $variant }) => ($variant === 'copy' ? 'V9_COLORS.TEXT.GRAY_DARK' : 'V9_COLORS.TEXT.WHITE')};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ $variant }) => ($variant === 'copy' ? '#f9fafb' : 'V9_COLORS.PRIMARY.BLUE_DARK')};
    border-color: ${({ $variant }) => ($variant === 'copy' ? 'V9_COLORS.TEXT.GRAY_LIGHT' : 'V9_COLORS.PRIMARY.BLUE_DARK')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Description = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const WarningBox = styled.div`
  background: V9_COLORS.BG.WARNING;
  border: 1px solid V9_COLORS.PRIMARY.YELLOW;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const WarningIcon = styled.div`
  color: V9_COLORS.PRIMARY.YELLOW_DARK;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.YELLOW_DARK;
  margin: 0 0 0.25rem 0;
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: V9_COLORS.PRIMARY.YELLOW_DARK;
  margin: 0;
  line-height: 1.5;
`;

const SetupInstructions = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  margin-top: 1rem;
`;

const SetupTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.BLUE_DARK;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SetupList = styled.ol`
  font-size: 0.875rem;
  color: V9_COLORS.PRIMARY.BLUE_DARK;
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.5;
`;

const SetupListItem = styled.li`
  margin-bottom: 0.25rem;
`;

interface CallbackUrlDisplayProps {
	flowType: string;
	baseUrl?: string;
	defaultExpanded?: boolean; // New prop to control default state
}

const CallbackUrlDisplay: React.FC<CallbackUrlDisplayProps> = ({
	flowType,
	baseUrl,
	defaultExpanded = false,
}) => {
	const [copied, setCopied] = useState(false);
	const [isSetupExpanded, setIsSetupExpanded] = useState(defaultExpanded);

	const callbackUrl = getCallbackUrlForFlow(flowType, baseUrl);
	const description = getCallbackDescription(flowType);
	const requiresRedirect = flowRequiresRedirectUri(flowType);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(callbackUrl);
			setCopied(true);
			logger.auth('CallbackUrlDisplay', 'Callback URL copied to clipboard', {
				flowType,
				callbackUrl,
			});
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			logger.error('CallbackUrlDisplay', 'Failed to copy callback URL', error);
		}
	};

	const handleOpenInNewTab = () => {
		window.open(callbackUrl, '_blank');
		logger.ui('CallbackUrlDisplay', 'Callback URL opened in new tab', { flowType, callbackUrl });
	};

	if (!requiresRedirect) {
		return (
			<CallbackUrlContainer>
				<CallbackUrlHeader>
					<CallbackUrlTitle>Redirect URI Configuration</CallbackUrlTitle>
				</CallbackUrlHeader>
				<WarningBox>
					<WarningIcon>
						<FiAlertTriangle />
					</WarningIcon>
					<WarningContent>
						<WarningTitle>No Redirect URI Required</WarningTitle>
						<WarningText>
							The {flowType} flow does not require a redirect URI. This flow uses direct token
							endpoint communication.
						</WarningText>
					</WarningContent>
				</WarningBox>
			</CallbackUrlContainer>
		);
	}

	return (
		<CallbackUrlContainer>
			<CallbackUrlHeader onClick={() => setIsSetupExpanded(!isSetupExpanded)}>
				<CallbackUrlTitle>Set the Redirect URI in PingOne</CallbackUrlTitle>
				<ChevronIcon>{isSetupExpanded ? <FiChevronDown /> : <FiChevronRight />}</ChevronIcon>
			</CallbackUrlHeader>
			<CallbackUrlContent $isExpanded={isSetupExpanded}>
				<Description>{description}</Description>

				<UrlDisplay>
					<UrlText>{callbackUrl}</UrlText>
					<ActionButton $variant="copy" onClick={handleCopy} disabled={copied}>
						{copied ? <FiCheck /> : <FiCopy />}
						{copied ? 'Copied!' : 'Copy'}
					</ActionButton>
					<ActionButton $variant="external" onClick={handleOpenInNewTab}>
						<FiExternalLink />
						Open
					</ActionButton>
				</UrlDisplay>

				<SetupInstructions>
					<SetupTitle>Setup Instructions:</SetupTitle>
					<SetupList>
						<SetupListItem>Copy the redirect URI above</SetupListItem>
						<SetupListItem>Go to your PingOne application settings</SetupListItem>
						<SetupListItem>Navigate to "Redirect URIs" section</SetupListItem>
						<SetupListItem>Add the copied URI to your allowed redirect URIs</SetupListItem>
						<SetupListItem>Save your configuration</SetupListItem>
					</SetupList>
				</SetupInstructions>
			</CallbackUrlContent>
		</CallbackUrlContainer>
	);
};

export default CallbackUrlDisplay;
