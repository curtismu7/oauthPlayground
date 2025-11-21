// src/services/pkceGenerationService.tsx
import React, { useCallback, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiCopy, FiKey, FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { UISettingsService } from './uiSettingsService';

// Styled components
const PKCESection = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PKCEHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e2e8f0;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div<{ $status: 'idle' | 'generating' | 'success' | 'error' }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: ${({ $status }) => {
		switch ($status) {
			case 'generating':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'success':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			case 'error':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
		}
	}};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	transition: all 0.3s ease;
`;

const HeaderText = styled.div`
	flex: 1;
`;

const PKCETitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`;

const PKCESubtitle = styled.p`
	font-size: 0.875rem;
	color: #64748b;
	margin: 0.25rem 0 0 0;
`;

const GenerateButton = styled.button<{ $isGenerating: boolean; $disabled: boolean }>`
	background: ${({ $disabled }) =>
		$disabled
			? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
			: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'};
	color: ${({ $disabled }) => ($disabled ? '#9ca3af' : 'white')};
	border: none;
	border-radius: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: ${({ $disabled }) => ($disabled ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)')};

	&:hover:not(:disabled) {
		background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
		box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
		transform: translateY(-1px);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.6;
	}
`;

const PKCEDisplay = styled.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const PKCEItem = styled.div`
	margin-bottom: 1rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const PKCELabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PKCEValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	border-radius: 0.375rem;
	padding: 0.75rem;
	color: #374151;
	word-break: break-all;
	line-height: 1.4;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
`;

const CopyButton = styled.button`
	background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	padding: 0.375rem;
	cursor: pointer;
	transition: all 0.2s ease;
	color: #6b7280;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	&:hover {
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
		color: #374151;
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	background: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
			case 'error':
				return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
			default:
				return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
		}
	}};
	border: 1px solid ${({ $type }) => {
		switch ($type) {
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
	border-radius: 0.5rem;
	padding: 0.75rem;
	margin-top: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return '#065f46';
			case 'error':
				return '#991b1b';
			default:
				return '#1e40af';
		}
	}};
`;

// PKCE Generation Component
export interface PKCEGenerationProps {
	controller: any;
	credentials: any;
	flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless';
	onPKCEGenerated?: () => void;
}

export const PKCEGenerationComponent: React.FC<PKCEGenerationProps> = ({
	controller,
	credentials,
	flowType,
	onPKCEGenerated,
}) => {
	const [isGenerating, _setIsGenerating] = useState(false);
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [statusMessage, setStatusMessage] = useState('');

	// Check if auto-generation is enabled
	const isAutoGenerateEnabled = UISettingsService.isEnabled('pkceAutoGenerate');

	const handleGeneratePKCE = useCallback(async () => {
		console.log('[PKCEGenerationService] handleGeneratePKCE called');

		if (!credentials.clientId || !credentials.environmentId) {
			console.log('[PKCEGenerationService] Missing credentials, aborting');
			setStatus('error');
			setStatusMessage('Missing Client ID or Environment ID. Please configure credentials first.');
			v4ToastManager.showError(
				'Missing Client ID or Environment ID. Please configure credentials first.'
			);
			return;
		}

		if (!controller?.generatePkceCodes) {
			console.error('[PKCEGenerationService] Controller does not have generatePkceCodes method');
			setStatus('error');
			setStatusMessage('PKCE generation not available. Please check your configuration.');
			v4ToastManager.showError('PKCE generation not available. Please check your configuration.');
			return;
		}

		console.log('[PKCEGenerationService] Starting PKCE generation...');
		setStatus('generating');
		setStatusMessage('Generating PKCE codes...');
		v4ToastManager.showSuccess('Generating PKCE codes...');

		try {
			console.log('[PKCEGenerationService] Calling controller.generatePkceCodes()...');
			await controller.generatePkceCodes();
			console.log('[PKCEGenerationService] PKCE generation completed successfully');

			setStatus('success');
			setStatusMessage('PKCE codes generated successfully!');
			v4ToastManager.showSuccess('PKCE codes generated!');
			onPKCEGenerated?.();
		} catch (error) {
			console.error('[PKCEGenerationService] PKCE generation failed:', error);
			setStatus('error');
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setStatusMessage(`Failed to generate PKCE codes: ${errorMessage}`);
			v4ToastManager.showError(`Failed to generate PKCE codes: ${errorMessage}`);
		}
	}, [controller, credentials.clientId, credentials.environmentId, onPKCEGenerated]);

	// Auto-generate PKCE codes when component mounts (if enabled)
	React.useEffect(() => {
		console.log('[PKCEGenerationService] Auto-generation check:', {
			isAutoGenerateEnabled,
			hasExistingPKCE: !!controller?.pkceCodes?.codeVerifier,
			shouldAutoGenerate: isAutoGenerateEnabled && !controller?.pkceCodes?.codeVerifier,
		});

		if (isAutoGenerateEnabled && !controller?.pkceCodes?.codeVerifier) {
			console.log('[PKCEGenerationService] Auto-generating PKCE codes...');
			handleGeneratePKCE();
		}
	}, [isAutoGenerateEnabled, controller?.pkceCodes?.codeVerifier, handleGeneratePKCE]);

	const _hasPkceCodes = !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge);

	const handleCopyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard!`);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	};

	// Determine status icon
	const getStatusIcon = () => {
		if (isGenerating) return <FiRefreshCw size={16} className="animate-spin" />;
		if (status === 'success') return <FiCheckCircle size={16} />;
		if (status === 'error') return <FiAlertCircle size={16} />;
		return <FiKey size={16} />;
	};

	// Determine if PKCE codes are available
	const hasPKCECodes = controller?.pkceCodes?.codeVerifier && controller?.pkceCodes?.codeChallenge;

	return (
		<PKCESection>
			<PKCEHeader>
				<HeaderContent>
					<HeaderIcon $status={isGenerating ? 'generating' : status}>{getStatusIcon()}</HeaderIcon>
					<HeaderText>
						<PKCETitle>PKCE Generation</PKCETitle>
						<PKCESubtitle>
							Generate secure code verifier and challenge for enhanced security
						</PKCESubtitle>
					</HeaderText>
				</HeaderContent>
				<GenerateButton
					$isGenerating={isGenerating}
					$disabled={isGenerating || !credentials.clientId || !credentials.environmentId}
					onClick={handleGeneratePKCE}
				>
					{isGenerating ? (
						<>
							<FiRefreshCw size={14} className="animate-spin" />
							Generating...
						</>
					) : (
						<>
							<FiKey size={14} />
							{hasPKCECodes ? 'Regenerate' : 'Generate PKCE'}
						</>
					)}
				</GenerateButton>
			</PKCEHeader>

			{hasPKCECodes && (
				<PKCEDisplay>
					<PKCEItem>
						<PKCELabel>
							<FiKey size={12} />
							Code Verifier
						</PKCELabel>
						<PKCEValue>
							<span>{controller.pkceCodes.codeVerifier}</span>
							<CopyButton
								onClick={() =>
									handleCopyToClipboard(controller.pkceCodes.codeVerifier, 'Code Verifier')
								}
								title="Copy Code Verifier"
							>
								<FiCopy size={12} />
							</CopyButton>
						</PKCEValue>
					</PKCEItem>

					<PKCEItem>
						<PKCELabel>
							<FiKey size={12} />
							Code Challenge
						</PKCELabel>
						<PKCEValue>
							<span>{controller.pkceCodes.codeChallenge}</span>
							<CopyButton
								onClick={() =>
									handleCopyToClipboard(controller.pkceCodes.codeChallenge, 'Code Challenge')
								}
								title="Copy Code Challenge"
							>
								<FiCopy size={12} />
							</CopyButton>
						</PKCEValue>
					</PKCEItem>
				</PKCEDisplay>
			)}

			{statusMessage && (
				<StatusMessage $type={status}>
					{status === 'success' && <FiCheckCircle size={16} />}
					{status === 'error' && <FiAlertCircle size={16} />}
					{status === 'idle' && <FiKey size={16} />}
					{statusMessage}
				</StatusMessage>
			)}
		</PKCESection>
	);
};

// Service class for easy integration
export class PKCEGenerationService {
	/**
	 * Show PKCE generation component
	 */
	static showComponent(props: PKCEGenerationProps): React.ReactElement {
		return <PKCEGenerationComponent {...props} />;
	}

	/**
	 * Generate PKCE codes programmatically
	 */
	static async generatePKCE(
		controller: any,
		credentials: any,
		_flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless'
	): Promise<boolean> {
		try {
			if (!credentials.clientId || !credentials.environmentId) {
				throw new Error('Missing Client ID or Environment ID');
			}

			if (!controller?.generatePkceCodes) {
				throw new Error('Controller does not support PKCE generation');
			}

			await controller.generatePkceCodes();
			return true;
		} catch (error) {
			console.error('[PKCEGenerationService] Generation failed:', error);
			return false;
		}
	}

	/**
	 * Check if PKCE codes are available
	 */
	static hasPKCECodes(controller: any): boolean {
		return !!(controller?.pkceCodes?.codeVerifier && controller?.pkceCodes?.codeChallenge);
	}
}

export default PKCEGenerationService;
