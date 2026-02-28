import React, { useState } from 'react';
import { FiCheck, FiCopy, FiExternalLink, FiX } from '@icons';
import styled from 'styled-components';
import { copyToClipboard } from '../utils/clipboard';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalContent = styled.div`
  margin-bottom: 2rem;
`;

const WarningBox = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const WarningTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WarningText = styled.p`
  color: #92400e;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const UriContainer = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const UriLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #166534;
  margin-bottom: 0.5rem;
`;

const UriDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #374151;
  word-break: break-all;
`;

const CopyButton = styled.button<{ copied: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${(props) => (props.copied ? '#10b981' : '#3b82f6')};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;

  &:hover {
    background: ${(props) => (props.copied ? '#059669' : '#2563eb')};
  }
`;

const InstructionsBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InstructionsTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
`;

const InstructionStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StepNumber = styled.div`
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const StepText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${(props) =>
		props.variant === 'primary'
			? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `
			: `
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

interface DefaultRedirectUriModalProps {
	isOpen: boolean;
	onClose: () => void;
	flowType: string;
	defaultRedirectUri: string;
	onContinue: () => void;
}

const DefaultRedirectUriModal: React.FC<DefaultRedirectUriModalProps> = ({
	isOpen,
	onClose,
	flowType,
	defaultRedirectUri,
	onContinue,
}) => {
	const [copied, setCopied] = useState(false);

	if (!isOpen) return null;

	const handleCopyUri = async () => {
		try {
			await copyToClipboard(defaultRedirectUri);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy redirect URI:', error);
		}
	};

	const getFlowDisplayName = (flowType: string) => {
		switch (flowType) {
			case 'oidc-implicit-v3':
				return 'OIDC Implicit Flow V3';
			case 'oauth2-implicit-v3':
				return 'OAuth2 Implicit Flow V3';
			case 'oidc-hybrid-v3':
				return 'OIDC Hybrid Flow V3';
			case 'enhanced-authorization-code-v3':
				return 'Enhanced Authorization Code Flow V3';
			case 'oauth-authorization-code-v3':
				return 'OAuth Authorization Code Flow V3';
			default:
				return flowType;
		}
	};

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>Configure Redirect URI</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalContent>
					<WarningBox>
						<WarningTitle>
							<FiExternalLink size={16} />
							Redirect URI Required
						</WarningTitle>
						<WarningText>
							No redirect URI is configured for {getFlowDisplayName(flowType)}. You need to
							configure this URI in your PingOne application to proceed.
						</WarningText>
					</WarningBox>

					<UriContainer>
						<UriLabel>Default Redirect URI for this flow:</UriLabel>
						<UriDisplay>
							{defaultRedirectUri}
							<CopyButton copied={copied} onClick={handleCopyUri}>
								{copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
								{copied ? 'Copied!' : 'Copy'}
							</CopyButton>
						</UriDisplay>
					</UriContainer>

					<InstructionsBox>
						<InstructionsTitle>How to configure this redirect URI:</InstructionsTitle>

						<InstructionStep>
							<StepNumber>1</StepNumber>
							<StepText>Copy the redirect URI above using the copy button</StepText>
						</InstructionStep>

						<InstructionStep>
							<StepNumber>2</StepNumber>
							<StepText>
								Go to your PingOne Admin Console Applications Your Application Configuration
							</StepText>
						</InstructionStep>

						<InstructionStep>
							<StepNumber>3</StepNumber>
							<StepText>
								Add the copied redirect URI to the "Redirect URIs" field in your application
								configuration
							</StepText>
						</InstructionStep>

						<InstructionStep>
							<StepNumber>4</StepNumber>
							<StepText>Save the configuration and return to this flow to continue</StepText>
						</InstructionStep>
					</InstructionsBox>
				</ModalContent>

				<ModalFooter>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="primary" onClick={onContinue}>
						Continue Anyway
					</Button>
				</ModalFooter>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default DefaultRedirectUriModal;
