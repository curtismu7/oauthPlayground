/**
 * @file AddCustomUrlModal.tsx
 * @description Modal for adding custom URLs to the sidebar
 * @version 1.0.0
 * @since 2024-11-19
 */

import React, { useState } from 'react';
import { FiPlus, FiX } from '@icons';
import styled from 'styled-components';

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 10000;
`;

const ModalContent = styled.div`
	background: white; /* Light background */
	border-radius: 12px;
	padding: 24px;
	width: 90%;
	max-width: 500px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	color: #1f2937; /* Dark text on light background */
	margin: 0;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280; /* Grey */
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6; /* Light grey background */
		color: #1f2937; /* Dark text */
	}
`;

const FormGroup = styled.div`
	margin-bottom: 16px;
`;

const Label = styled.label`
	display: block;
	font-size: 14px;
	font-weight: 500;
	color: #374151; /* Dark text on light background */
	margin-bottom: 6px;
`;

const Input = styled.input`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	color: #1f2937; /* Dark text on light background */
	background: white; /* Light background */
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: #3b82f6; /* Blue */
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af; /* Grey */
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 10px 20px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 8px;

	${({ $variant }) =>
		$variant === 'primary'
			? `
		background: #3b82f6; /* Blue */
		color: white; /* Light text on dark background */
		
		&:hover {
			background: #2563eb; /* Dark blue */
		}
	`
			: `
		background: #f3f4f6; /* Light grey */
		color: #374151; /* Dark text on light background */
		border: 1px solid #d1d5db;
		
		&:hover {
			background: #e5e7eb; /* Grey */
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const HelpText = styled.p`
	font-size: 12px;
	color: #6b7280; /* Grey text on light background */
	margin: 8px 0 0 0;
`;

interface CustomUrl {
	id: string;
	label: string;
	path: string;
}

interface AddCustomUrlModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAdd: (url: CustomUrl) => void;
}

export const AddCustomUrlModal: React.FC<AddCustomUrlModalProps> = ({ isOpen, onClose, onAdd }) => {
	const [label, setLabel] = useState('');
	const [path, setPath] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!label.trim() || !path.trim()) {
			return;
		}

		const customUrl: CustomUrl = {
			id: `custom-${Date.now()}`,
			label: label.trim(),
			path: path.trim(),
		};

		onAdd(customUrl);

		// Reset form
		setLabel('');
		setPath('');
		onClose();
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Add Custom URL</ModalTitle>
					<CloseButton onClick={onClose} aria-label="Close modal">
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<form onSubmit={handleSubmit}>
					<FormGroup>
						<Label htmlFor="custom-url-label">Label</Label>
						<Input
							id="custom-url-label"
							type="text"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="My Custom Flow"
							required
						/>
						<HelpText>Display name for the menu item</HelpText>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="custom-url-path">URL Path</Label>
						<Input
							id="custom-url-path"
							type="text"
							value={path}
							onChange={(e) => setPath(e.target.value)}
							placeholder="/flows/my-custom-flow"
							required
						/>
						<HelpText>
							Relative path (e.g., /flows/mfa-v8) or full URL (e.g., https://example.com)
						</HelpText>
					</FormGroup>

					<ButtonGroup>
						<Button type="button" $variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" $variant="primary" disabled={!label.trim() || !path.trim()}>
							<FiPlus size={16} />
							Add URL
						</Button>
					</ButtonGroup>
				</form>
			</ModalContent>
		</ModalOverlay>
	);
};

export default AddCustomUrlModal;
