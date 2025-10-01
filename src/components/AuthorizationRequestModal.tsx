import React, { useEffect, useId } from 'react';
import { FiCheck, FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import ColorCodedURL from './ColorCodedURL';

interface AuthorizationRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onProceed: () => void;
	authorizationUrl: string;
	requestParams: Record<string, string>;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;

    &:hover {
      background-color: #f3f4f6;
      color: #374151;
    }
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ParameterLabel = styled.div`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const ParameterValue = styled.div`
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875rem;
  color: #1f2937;
  background-color: #f9fafb;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  word-break: break-all;
`;

const AuthorizationUrlBox = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const AuthorizationUrl = styled.div`
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875rem;
  color: #1e293b;
  word-break: break-all;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  background: ${({ $copied }) => ($copied ? '#10b981' : '#3b82f6')};
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: fit-content;

  &:hover {
    background: ${({ $copied }) => ($copied ? '#059669' : '#2563eb')};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({ $variant }) =>
		$variant === 'primary'
			? `
        background-color: #3b82f6;
        color: white;
        &:hover {
          background-color: #2563eb;
        }
      `
			: `
        background-color: #f3f4f6;
        color: #374151;
        &:hover {
          background-color: #e5e7eb;
        }
      `}
`;

const InfoBox = styled.div`
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e40af;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #1e40af;
    line-height: 1.5;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: #3b82f6;
    cursor: pointer;
  }

  label {
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    user-select: none;
  }
`;

const AuthorizationRequestModal: React.FC<AuthorizationRequestModalProps> = ({
	isOpen,
	onClose,
	onProceed,
	authorizationUrl,
	requestParams,
}) => {
	const checkboxId = useId();
	const [copied, setCopied] = React.useState(false);
	const [dontShowAgain, setDontShowAgain] = React.useState(false);

	// Handle escape key to close modal
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [isOpen, onClose]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(authorizationUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	const handleProceed = () => {
		// Save the "don't show again" preference if checked
		if (dontShowAgain) {
			// Update the configuration setting to disable the modal
			const flowConfigKey = 'enhanced-flow-authorization-code';
			const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
			const updatedFlowConfig = {
				...existingFlowConfig,
				showAuthRequestModal: false, // Set to false to disable the modal
			};
			localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));

			console.log(
				' [AuthorizationRequestModal] User chose to skip this modal in future - updated configuration:',
				updatedFlowConfig
			);

			// Dispatch custom event to notify other components that config has changed
			window.dispatchEvent(
				new CustomEvent('uiSettingsChanged', {
					detail: { showAuthRequestModal: false },
				})
			);
		}

		onProceed();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<ModalOverlay $isOpen={isOpen}>
			<ModalContent>
				<ModalHeader>
					<h2>OAuth Authorization Request</h2>
					<button type="button" className="close-button" onClick={onClose}>
						<FiX />
					</button>
				</ModalHeader>

				<ModalBody>
					<InfoBox>
						<h4>What happens next?</h4>
						<p>
							You're about to be redirected to PingOne for authentication. This modal shows the
							authorization request that will be sent to PingOne. After successful authentication,
							you'll be redirected back to this application.
						</p>
					</InfoBox>

					<Section>
						<h3> Request Parameters</h3>
						<ParameterGrid>
							{Object.entries(requestParams).map(([key, value]) => (
								<React.Fragment key={key}>
									<ParameterLabel>{key}</ParameterLabel>
									<ParameterValue>{value}</ParameterValue>
								</React.Fragment>
							))}
						</ParameterGrid>
					</Section>

					<Section>
						<h3> Authorization URL</h3>
						<AuthorizationUrlBox>
							<AuthorizationUrl>
								<ColorCodedURL url={authorizationUrl} />
							</AuthorizationUrl>
							<CopyButton $copied={copied} onClick={handleCopy}>
								{copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
								{copied ? 'Copied!' : 'Copy URL'}
							</CopyButton>
						</AuthorizationUrlBox>
					</Section>

					<CheckboxContainer>
						<input
							type="checkbox"
							id={checkboxId}
							checked={dontShowAgain}
							onChange={(e) => setDontShowAgain(e.target.checked)}
						/>
						<label htmlFor={checkboxId}>Do not show this modal again</label>
					</CheckboxContainer>

					<ActionButtons>
						<Button onClick={onClose}>Cancel</Button>
						<Button $variant="primary" onClick={handleProceed}>
							<FiExternalLink size={16} />
							Proceed to PingOne
						</Button>
					</ActionButtons>
				</ModalBody>
			</ModalContent>
		</ModalOverlay>
	);
};

export default AuthorizationRequestModal;
