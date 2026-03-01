/**
 * @file PasswordChangeModal.tsx
 * @description Modal component for handling MUST_CHANGE_PASSWORD requirement
 * @version 1.0.0
 */

import { FiAlertCircle, FiEye, FiEyeOff, FiLock, FiX } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
`;

const ModalContainer = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	width: 90%;
	max-width: 500px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	position: relative;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const IconContainer = styled.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: #fef3c7;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #d97706;
	font-size: 24px;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	flex: 1;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	font-size: 1.5rem;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s;

	&:hover {
		color: #1f2937;
	}
`;

const Message = styled.p`
	color: #4b5563;
	margin-bottom: 1.5rem;
	line-height: 1.6;
`;

const FormGroup = styled.div`
	margin-bottom: 1.25rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

const InputContainer = styled.div`
	position: relative;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	padding-right: 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 1rem;
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const PasswordToggle = styled.button`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s;

	&:hover {
		color: #1f2937;
	}
`;

const ErrorMessage = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	color: #991b1b;
	padding: 0.75rem;
	border-radius: 6px;
	margin-bottom: 1rem;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	flex: 1;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;

	${(props) =>
		props.variant === 'primary'
			? `
		background: #6366f1;
		color: white;
		&:hover:not(:disabled) {
			background: #4f46e5;
		}
		&:disabled {
			background: #9ca3af;
			cursor: not-allowed;
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

interface PasswordChangeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>;
	userId?: string;
	environmentId?: string;
	message?: string;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
	isOpen,
	onClose,
	onPasswordChange,
	userId,
	environmentId,
	message,
}) => {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validation
		if (!oldPassword || !newPassword || !confirmPassword) {
			setError('All fields are required');
			return;
		}

		if (newPassword !== confirmPassword) {
			setError('New passwords do not match');
			return;
		}

		if (newPassword.length < 8) {
			setError('New password must be at least 8 characters long');
			return;
		}

		if (oldPassword === newPassword) {
			setError('New password must be different from the current password');
			return;
		}

		setIsLoading(true);
		try {
			await onPasswordChange(oldPassword, newPassword);
			// Success - modal will be closed by parent component
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to change password');
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			setOldPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setError(null);
			onClose();
		}
	};

	return (
		<ModalOverlay onClick={handleClose}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<IconContainer>
						<FiLock />
					</IconContainer>
					<Title>Password Change Required</Title>
					<CloseButton onClick={handleClose} disabled={isLoading}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				{message && <Message>{message}</Message>}

				{error && (
					<ErrorMessage>
						<FiAlertCircle />
						{error}
					</ErrorMessage>
				)}

				<form onSubmit={handleSubmit}>
					<FormGroup>
						<Label htmlFor="old-password">Current Password</Label>
						<InputContainer>
							<Input
								id="old-password"
								type={showOldPassword ? 'text' : 'password'}
								value={oldPassword}
								onChange={(e) => setOldPassword(e.target.value)}
								placeholder="Enter your current password"
								disabled={isLoading}
								autoFocus
							/>
							<PasswordToggle
								type="button"
								onClick={() => setShowOldPassword(!showOldPassword)}
								disabled={isLoading}
							>
								{showOldPassword ? <FiEyeOff /> : <FiEye />}
							</PasswordToggle>
						</InputContainer>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="new-password">New Password</Label>
						<InputContainer>
							<Input
								id="new-password"
								type={showNewPassword ? 'text' : 'password'}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Enter your new password (min. 8 characters)"
								disabled={isLoading}
							/>
							<PasswordToggle
								type="button"
								onClick={() => setShowNewPassword(!showNewPassword)}
								disabled={isLoading}
							>
								{showNewPassword ? <FiEyeOff /> : <FiEye />}
							</PasswordToggle>
						</InputContainer>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="confirm-password">Confirm New Password</Label>
						<InputContainer>
							<Input
								id="confirm-password"
								type={showConfirmPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm your new password"
								disabled={isLoading}
							/>
							<PasswordToggle
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								disabled={isLoading}
							>
								{showConfirmPassword ? <FiEyeOff /> : <FiEye />}
							</PasswordToggle>
						</InputContainer>
					</FormGroup>

					<ButtonGroup>
						<Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
							Cancel
						</Button>
						<Button type="submit" variant="primary" disabled={isLoading}>
							{isLoading ? 'Changing...' : 'Change Password'}
						</Button>
					</ButtonGroup>
				</form>
			</ModalContainer>
		</ModalOverlay>
	);
};
