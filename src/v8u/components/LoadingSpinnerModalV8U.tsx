/**
 * @file LoadingSpinnerModalV8U.tsx
 * @module v8u/components
 * @description Reusable loading spinner modal component with backdrop
 * @version 8.0.0
 *
 * Based on the SPIFFE flow spinner design, but with configurable colors.
 * Used for showing loading states during API calls and async operations.
 */

import React from 'react';
import { FiLoader } from 'react-icons/fi';
import styled from 'styled-components';

interface LoadingSpinnerModalV8UProps {
	/** Whether to show the modal */
	show: boolean;
	/** Message to display */
	message: string;
	/** Optional icon component (defaults to FiLoader) */
	icon?: React.ReactNode;
	/** Color theme: 'blue' (default), 'green', 'orange', 'purple' */
	theme?: 'blue' | 'green' | 'orange' | 'purple';
}

const Backdrop = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 10001;
	animation: fadeIn 0.3s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const Modal = styled.div<{ $theme: 'blue' | 'green' | 'orange' | 'purple' }>`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: ${(props) => {
		switch (props.$theme) {
			case 'green':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			case 'orange':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'purple':
				return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
			default:
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
		}
	}};
	color: white;
	padding: 2rem 3rem;
	border-radius: 1rem;
	font-size: 1.5rem;
	font-weight: 700;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	z-index: 10002;
	animation: phaseSlideIn 0.5s ease-out;
	display: flex;
	align-items: center;
	gap: 1rem;

	@keyframes phaseSlideIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	svg {
		font-size: 2rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

export const LoadingSpinnerModalV8U: React.FC<LoadingSpinnerModalV8UProps> = ({
	show,
	message,
	icon,
	theme = 'blue',
}) => {
	if (!show) return null;

	return (
		<>
			<Backdrop />
			<Modal $theme={theme}>
				{icon || <FiLoader />}
				{message}
			</Modal>
		</>
	);
};

export default LoadingSpinnerModalV8U;
