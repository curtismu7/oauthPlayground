/**
 * @file FlowNotAvailableModal.tsx
 * @module v8u/components
 * @description Modal to inform user when selected flow is not available for the spec version
 * @version 8.0.0
 * @since 2024-11-19
 */

import React from 'react';
import styled from 'styled-components';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import { SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

interface FlowNotAvailableModalProps {
	isOpen: boolean;
	onClose: () => void;
	requestedFlow: FlowType;
	specVersion: SpecVersion;
	fallbackFlow: FlowType;
	onAccept: () => void;
	onChangeSpec: () => void;
}

const _MODULE_TAG = '[🚫 FLOW-NOT-AVAILABLE-MODAL-V8U]';

// Styled components
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

const ModalContent = styled.div`
	background: white;
	border-radius: 8px;
	padding: 24px;
	max-width: 500px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	
	.icon {
		font-size: 24px;
		color: #dc3545;
	}
	
	h2 {
		margin: 0;
		color: #333;
		font-size: 20px;
		font-weight: 600;
	}
`;

const ModalBody = styled.div`
	margin-bottom: 24px;
	
	p {
		margin: 0 0 12px 0;
		color: #666;
		line-height: 1.5;
	}
	
	.flow-info {
		background: #f8f9fa;
		padding: 12px;
		border-radius: 4px;
		margin: 12px 0;
		
		strong {
			color: #333;
		}
	}
`;

const ModalFooter = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`;

const BaseButton = styled.button`
	padding: 12px 24px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
`;

const PrimaryButton = styled(BaseButton)`
	background: #007bff;
	color: white;
	
	&:hover {
		background: #0056b3;
	}
`;

const SecondaryButton = styled(BaseButton)`
	background: #6c757d;
	color: white;
	
	&:hover {
		background: #5a6268;
	}
`;

export const FlowNotAvailableModal: React.FC<FlowNotAvailableModalProps> = ({
	isOpen,
	onClose,
	requestedFlow,
	specVersion,
	fallbackFlow,
	onAccept,
	onChangeSpec,
}) => {
	if (!isOpen) return null;

	const requestedFlowLabel = SpecVersionServiceV8.getFlowLabel(requestedFlow);
	const specLabel = SpecVersionServiceV8.getSpecLabel(specVersion);
	const fallbackFlowLabel = SpecVersionServiceV8.getFlowLabel(fallbackFlow);

	// CRITICAL: Log the actual spec version being used to debug modal issues
	logger.debug('Modal rendering', {
		requestedFlow,
		specVersion,
		specLabel,
		fallbackFlow,
		isOpen,
	});

	// Get reason why flow is not available
	const unavailabilityReason = `${requestedFlowLabel} is not supported in ${specLabel}. Please use a different flow or specification version.`;

	const handleAccept = () => {
		logger.debug('User accepted fallback flow', {
			requestedFlow,
			fallbackFlow,
		});
		onAccept();
	};

	const handleChangeSpec = () => {
		logger.debug('User requested spec version change', {
			requestedFlow,
			currentSpec: specVersion,
		});
		onChangeSpec();
	};

	const handleClose = () => {
		logger.debug('Modal closed', {
			requestedFlow,
			specVersion,
		});
		onClose();
	};

	return (
		<ModalOverlay onClick={handleClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<span className="icon">⚠️</span>
					<h2>Flow Not Available</h2>
				</ModalHeader>

				<ModalBody>
					<p>
						The <strong>{requestedFlowLabel}</strong> flow is not available in{' '}
						<strong>{specLabel}</strong>.
					</p>

					<div className="flow-info">
						<strong>Reason:</strong> {unavailabilityReason}
					</div>

					<p>You can either:</p>
					<ul>
						<li>
							Use the <strong>{fallbackFlowLabel}</strong> flow instead
						</li>
						<li>Change to a different specification version that supports {requestedFlowLabel}</li>
					</ul>
				</ModalBody>

				<ModalFooter>
					<SecondaryButton onClick={handleChangeSpec}>Change Spec Version</SecondaryButton>
					<PrimaryButton onClick={handleAccept}>Use {fallbackFlowLabel}</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
