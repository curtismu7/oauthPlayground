/**
 * @file DeviceCodePollingModalV8U.tsx
 * @module v8/components
 * @description Modal for device code polling with progress indicator
 * @version 8.0.0
 */

import React from 'react';
import styled from 'styled-components';
import { ModalSpinnerServiceV8U } from '@/v8/services/modalSpinnerServiceV8U';

interface DeviceCodePollingModalProps {
	/** Whether to show the modal */
	show: boolean;
	/** Current polling status */
	status: string;
	/** Number of polling attempts made */
	attempts: number;
	/** Maximum number of allowed attempts */
	maxAttempts: number;
	/** Callback when user cancels polling */
	onCancel: () => void;
}

const Modal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10002;
	animation: fadeIn 0.3s ease-out;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 24px;
	max-width: 400px;
	width: 90%;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	text-align: center;
`;

const Title = styled.h3`
	margin: 0 0 16px 0;
	color: #1f2937;
	font-size: 18px;
	font-weight: 600;
`;

const StatusText = styled.p`
	margin: 8px 0;
	color: #6b7280;
	font-size: 14px;
`;

const ProgressBar = styled.div<{ $progress: number }>`
	width: 100%;
	height: 4px;
	background: #e5e7eb;
	border-radius: 2px;
	overflow: hidden;
	margin: 12px 0;

	&::after {
		content: '';
		display: block;
		height: 100%;
		width: ${({ $progress }) => $progress}%;
		background: linear-gradient(90deg, #3b82f6, #2563eb);
		border-radius: 2px;
		transition: width 0.3s ease;
	}
`;

const CancelButton = styled.button`
	margin-top: 16px;
	padding: 8px 16px;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;

	&:hover {
		background: #dc2626;
	}
`;

const _fadeIn = styled.keyframes`
	from {
		opacity: 0;
		transform: scale(0.9);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
`;

export const DeviceCodePollingModalV8U: React.FC<DeviceCodePollingModalProps> = ({
	show,
	status,
	attempts,
	maxAttempts,
	onCancel,
}) => {
	// Use service for consistent state management
	const modalKey = 'deviceCodePollingModalV8U';

	// Initialize state if not exists
	ModalSpinnerServiceV8U.getInstance(modalKey, {
		show: false,
		message: '',
		theme: 'blue',
	});

	// Update state when props change
	React.useEffect(() => {
		ModalSpinnerServiceV8U.updateState(modalKey, {
			show,
			message: `Waiting for device authorization... (${attempts}/${maxAttempts})`,
			theme: 'blue',
		});
	}, [show, attempts, maxAttempts]);

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			ModalSpinnerServiceV8U.cleanup(modalKey);
		};
	}, []);

	if (!show) return null;

	return (
		<Modal>
			<ModalContent>
				<Title>📱 Device Code Polling</Title>
				<StatusText>Waiting for device authorization...</StatusText>
				<StatusText>Status: {status}</StatusText>
				<ProgressBar $progress={(attempts / maxAttempts) * 100} />
				<StatusText>
					Attempt {attempts} of {maxAttempts}
				</StatusText>
				<CancelButton onClick={onCancel}>Cancel Polling</CancelButton>
			</ModalContent>
		</Modal>
	);
};

export default DeviceCodePollingModal;
