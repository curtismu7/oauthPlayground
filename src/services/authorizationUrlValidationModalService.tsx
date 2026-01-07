// src/services/authorizationUrlValidationModalService.tsx
// Modal service for displaying authorization URL validation results

import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';
import styled from 'styled-components';
import type { UrlValidationResult } from './authorizationUrlValidationService';

// Styled Components
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
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div<{ severity: UrlValidationResult['severity'] }>`
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: ${(props) => {
		switch (props.severity) {
			case 'error':
				return '#fef2f2';
			case 'warning':
				return '#fffbeb';
			case 'info':
				return '#f0f9ff';
			default:
				return '#f9fafb';
		}
	}};
  border-radius: 12px 12px 0 0;
`;

const ModalTitle = styled.h2<{ severity: UrlValidationResult['severity'] }>`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => {
		switch (props.severity) {
			case 'error':
				return '#dc2626';
			case 'warning':
				return '#d97706';
			case 'info':
				return '#2563eb';
			default:
				return '#374151';
		}
	}};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ValidationMessage = styled.p`
  margin: 0 0 1rem;
  color: #6b7280;
  line-height: 1.5;
`;

const ValidationDetails = styled.div`
  margin-top: 1rem;
`;

const DetailItem = styled.div<{ type: 'error' | 'warning' | 'suggestion' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
  background: ${(props) => {
		switch (props.type) {
			case 'error':
				return '#fef2f2';
			case 'warning':
				return '#fffbeb';
			case 'suggestion':
				return '#f0f9ff';
			default:
				return '#f9fafb';
		}
	}};
  border-left: 3px solid ${(props) => {
		switch (props.type) {
			case 'error':
				return '#dc2626';
			case 'warning':
				return '#d97706';
			case 'suggestion':
				return '#2563eb';
			default:
				return '#d1d5db';
		}
	}};
`;

const DetailIcon = styled.div<{ type: 'error' | 'warning' | 'suggestion' }>`
  color: ${(props) => {
		switch (props.type) {
			case 'error':
				return '#dc2626';
			case 'warning':
				return '#d97706';
			case 'suggestion':
				return '#2563eb';
			default:
				return '#6b7280';
		}
	}};
  margin-top: 0.125rem;
`;

const DetailText = styled.span`
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  
  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #2563eb;
          color: white;
          &:hover {
            background: #1d4ed8;
          }
        `;
			case 'secondary':
				return `
          background: #f9fafb;
          color: #374151;
          border-color: #d1d5db;
          &:hover {
            background: #f3f4f6;
          }
        `;
			case 'danger':
				return `
          background: #dc2626;
          color: white;
          &:hover {
            background: #b91c1c;
          }
        `;
		}
	}}
`;

const UrlDisplay = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #374151;
  word-break: break-all;
  line-height: 1.4;
`;

const FlowTypeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
`;

interface AuthorizationUrlValidationModalProps {
	isOpen: boolean;
	onClose: () => void;
	validationResult: UrlValidationResult;
	url: string;
	onProceed?: () => void;
	onFix?: () => void;
}

export const AuthorizationUrlValidationModal: React.FC<AuthorizationUrlValidationModalProps> = ({
	isOpen,
	onClose,
	validationResult,
	url,
	onProceed,
	onFix,
}) => {
	if (!isOpen) return null;

	const { isValid, errors, warnings, suggestions, flowType, severity } = validationResult;
	const summary = authorizationUrlValidationService.getValidationSummary(validationResult);

	const getIcon = () => {
		switch (severity) {
			case 'error':
				return <FiXCircle size={24} />;
			case 'warning':
				return <FiAlertTriangle size={24} />;
			case 'info':
				return <FiCheckCircle size={24} />;
			default:
				return <FiInfo size={24} />;
		}
	};

	const handleProceed = () => {
		if (onProceed) onProceed();
		onClose();
	};

	const handleFix = () => {
		if (onFix) onFix();
		onClose();
	};

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader severity={severity}>
					<ModalTitle severity={severity}>
						{getIcon()}
						{summary.title}
					</ModalTitle>
				</ModalHeader>

				<ModalBody>
					<ValidationMessage>{summary.message}</ValidationMessage>

					<div style={{ marginBottom: '1rem' }}>
						<strong>Flow Type:</strong> <FlowTypeBadge>{flowType}</FlowTypeBadge>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<strong>Authorization URL:</strong>
						<UrlDisplay>{url}</UrlDisplay>
					</div>

					<ValidationDetails>
						{errors.map((error, index) => (
							<DetailItem key={`error-${index}`} type="error">
								<DetailIcon type="error">
									<FiXCircle size={16} />
								</DetailIcon>
								<DetailText>{error}</DetailText>
							</DetailItem>
						))}

						{warnings.map((warning, index) => (
							<DetailItem key={`warning-${index}`} type="warning">
								<DetailIcon type="warning">
									<FiAlertTriangle size={16} />
								</DetailIcon>
								<DetailText>{warning}</DetailText>
							</DetailItem>
						))}

						{suggestions.map((suggestion, index) => (
							<DetailItem key={`suggestion-${index}`} type="suggestion">
								<DetailIcon type="suggestion">
									<FiInfo size={16} />
								</DetailIcon>
								<DetailText>{suggestion}</DetailText>
							</DetailItem>
						))}
					</ValidationDetails>
				</ModalBody>

				<ModalFooter>
					<Button variant="secondary" onClick={onClose}>
						Close
					</Button>

					{!isValid && onFix && (
						<Button variant="danger" onClick={handleFix}>
							Fix Issues
						</Button>
					)}

					{isValid && onProceed && (
						<Button variant="primary" onClick={handleProceed}>
							Proceed with Authorization
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

// Service class for managing modal state
class AuthorizationUrlValidationModalService {
	private static instance: AuthorizationUrlValidationModalService;
	private modalState: {
		isOpen: boolean;
		validationResult: UrlValidationResult | null;
		url: string;
		onProceed?: () => void;
		onFix?: () => void;
	} = {
		isOpen: false,
		validationResult: null,
		url: '',
	};

	static getInstance(): AuthorizationUrlValidationModalService {
		if (!AuthorizationUrlValidationModalService.instance) {
			AuthorizationUrlValidationModalService.instance =
				new AuthorizationUrlValidationModalService();
		}
		return AuthorizationUrlValidationModalService.instance;
	}

	/**
	 * Show validation modal with results
	 */
	showValidationModal(
		validationResult: UrlValidationResult,
		url: string,
		onProceed?: () => void,
		onFix?: () => void
	): void {
		this.modalState = {
			isOpen: true,
			validationResult,
			url,
			onProceed,
			onFix,
		};

		// Trigger re-render by dispatching custom event
		window.dispatchEvent(
			new CustomEvent('urlValidationModalUpdate', {
				detail: this.modalState,
			})
		);
	}

	/**
	 * Hide validation modal
	 */
	hideModal(): void {
		this.modalState = {
			isOpen: false,
			validationResult: null,
			url: '',
		};

		window.dispatchEvent(
			new CustomEvent('urlValidationModalUpdate', {
				detail: this.modalState,
			})
		);
	}

	/**
	 * Get current modal state
	 */
	getModalState() {
		return this.modalState;
	}
}

// Export singleton instance
export const authorizationUrlValidationModalService =
	AuthorizationUrlValidationModalService.getInstance();

// Export components and service
export { AuthorizationUrlValidationModalService };

// Global access for debugging
if (typeof window !== 'undefined') {
	(window as any).authorizationUrlValidationModalService = authorizationUrlValidationModalService;
}
