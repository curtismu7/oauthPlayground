import React from 'react';
import styled from 'styled-components';
import { FiAlertTriangle } from 'react-icons/fi';

interface ModalActionDescriptor {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary';
}

interface ModalPresentationServiceProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: string;
	actions?: ModalActionDescriptor[];
	children?: React.ReactNode;
}

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(15, 23, 42, 0.65);
	backdrop-filter: blur(6px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
`;

const Dialog = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 30px 60px rgba(15, 23, 42, 0.25);
	width: min(520px, 90vw);
	padding: 2.5rem 2.25rem;
	position: relative;
	text-align: left;
`;

const WarningIcon = styled.div`
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: rgba(251, 191, 36, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #d97706;
	margin-bottom: 1.5rem;
`;

const Title = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #111827;
	margin: 0 0 0.75rem 0;
`;

const Description = styled.p`
	font-size: 1rem;
	color: #374151;
	line-height: 1.6;
	margin: 0 0 1.75rem 0;
`;

const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: flex-end;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	border: none;
	border-radius: 0.75rem;
	padding: 0.75rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: all 0.2s ease;

	${({ $variant }) =>
		$variant === 'primary'
			? `
			background: #2563eb;
			color: #ffffff;
			box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
			&:hover {
				background: #1d4ed8;
			}
		`
			: `
			background: #f3f4f6;
			color: #1f2937;
			border: 1px solid #d1d5db;
			&:hover {
				background: #e5e7eb;
			}
		`}
`;

const ModalPresentationService: React.FC<ModalPresentationServiceProps> = ({
	isOpen,
	onClose,
	title,
	description,
	actions,
 	children,
}) => {
	if (!isOpen) {
		return null;
	}

	const modalActions = actions && actions.length > 0
		? actions
		: [
			{
				label: 'Close',
				onClick: onClose,
				variant: 'primary' as const,
			},
		];

	return (
		<Overlay role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
			<Dialog>
				<WarningIcon>
					<FiAlertTriangle size={28} />
				</WarningIcon>
				<Title id="modal-title">{title}</Title>
				<Description id="modal-description">{description}</Description>
				{children}
				<Actions>
					{modalActions.map(({ label, onClick, variant = 'secondary' }, index) => (
						<ActionButton
							key={`${label}-${index}`}
							onClick={onClick}
							$variant={variant}
						>
							{label}
						</ActionButton>
					))}
				</Actions>
			</Dialog>
		</Overlay>
	);
};

export default ModalPresentationService;
