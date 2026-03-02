// src/services/v9/v9ModalPresentationService.tsx
// V9 Wrapper for ModalPresentationService - Modern Messaging Compliant

import React from 'react';
import ModalPresentationService from '../modalPresentationService';
import { v9MessagingService } from './V9MessagingService';

// ModalActionDescriptor interface (copied from original for type safety)
interface ModalActionDescriptor {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary';
}

// V9 Wrapper Component
interface V9ModalPresentationServiceProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: string;
	actions?: ModalActionDescriptor[];
	children?: React.ReactNode;
	style?: React.CSSProperties;
	draggable?: boolean;
	showCloseButton?: boolean;
}

const V9ModalPresentationService: React.FC<V9ModalPresentationServiceProps> = (props) => {
	// Wrap action callbacks with Modern Messaging
	const wrappedActions =
		props.actions?.map((action) => ({
			...action,
			onClick: () => {
				try {
					action.onClick();
					v9MessagingService.showSuccess(`Action completed: ${action.label}`);
				} catch (error) {
					v9MessagingService.showError(`Failed to execute action: ${action.label}`);
					console.error('Modal action error:', error);
				}
			},
			variant: action.variant || ('primary' as const),
		})) || [];

	// Wrap close callback with Modern Messaging
	const handleClose = () => {
		try {
			props.onClose();
			// Don't show message on close - it's expected behavior
		} catch (error) {
			v9MessagingService.showError('Failed to close modal');
			console.error('Modal close error:', error);
		}
	};

	// Add V9 error boundary
	try {
		return (
			<div data-v9-modal-presentation={props.title}>
				<ModalPresentationService {...props} actions={wrappedActions} onClose={handleClose} />
			</div>
		);
	} catch (error) {
		v9MessagingService.showError('Failed to render modal');
		console.error('Modal render error:', error);

		// Return fallback error modal
		return (
			<div
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: '#ffffff',
					border: '1px solid #dc2626',
					borderRadius: '0.5rem',
					padding: '1rem',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
					zIndex: 9999,
					maxWidth: '400px',
				}}
			>
				<div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc2626' }}>
					Modal Error
				</div>
				<div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
					Unable to display modal. Please try again.
				</div>
				<button
					type="button"
					onClick={handleClose}
					style={{
						background: '#dc2626',
						color: 'white',
						border: 'none',
						padding: '0.5rem 1rem',
						borderRadius: '0.25rem',
						cursor: 'pointer',
					}}
				>
					Close
				</button>
			</div>
		);
	}
};

// Add V9-specific logging for modal operations
const V9ModalService = {
	logModalOperation(operation: string, title: string, details?: unknown) {
		console.log(`[V9 ModalService] ${operation} for modal: ${title}`, details);
	},

	// Helper to create standard modal actions
	createAction(
		label: string,
		onClick: () => void,
		variant: 'primary' | 'secondary' = 'primary'
	): ModalActionDescriptor {
		return { label, onClick, variant };
	},

	// Helper to create confirmation modal
	createConfirmationModal(
		title: string,
		description: string,
		onConfirm: () => void,
		onCancel: () => void
	): {
		title: string;
		description: string;
		actions: ModalActionDescriptor[];
	} {
		return {
			title,
			description,
			actions: [
				{
					label: 'Cancel',
					onClick: onCancel,
					variant: 'secondary',
				},
				{
					label: 'Confirm',
					onClick: onConfirm,
					variant: 'primary',
				},
			],
		};
	},
};

export default V9ModalPresentationService;
export type { ModalActionDescriptor };
export { V9ModalService };
