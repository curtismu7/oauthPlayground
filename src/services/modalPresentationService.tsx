import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

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
	style?: React.CSSProperties;
	draggable?: boolean;
	showCloseButton?: boolean;
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

const Dialog = styled.div<{ $isDragging?: boolean; $position?: { x: number; y: number } }>`
	background: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 30px 60px rgba(15, 23, 42, 0.25);
	width: min(520px, 90vw);
	padding: 0;
	position: ${props => props.$position ? 'fixed' : 'relative'};
	top: ${props => props.$position ? `${props.$position.y}px` : 'auto'};
	left: ${props => props.$position ? `${props.$position.x}px` : 'auto'};
	text-align: left;
	cursor: ${({ $isDragging }) => ($isDragging ? 'grabbing' : 'default')};
	user-select: ${({ $isDragging }) => ($isDragging ? 'none' : 'auto')};
	transition: ${({ $isDragging }) => ($isDragging ? 'none' : 'all 0.2s ease')};
	overflow: hidden;
`;

const ModalBody = styled.div`
	padding: 2.5rem 2.25rem;
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

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: #f3f4f6;
	border: none;
	border-radius: 50%;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	color: #6b7280;

	&:hover {
		background: #e5e7eb;
		color: #374151;
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`;

const ModalHeader = styled.div<{ $isDragging?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 1.25rem 2.25rem;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	border-radius: 1rem 1rem 0 0;
	cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
	user-select: none;
	margin: 0;
	
	&:active {
		cursor: grabbing;
	}
`;

const HeaderTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
`;

const HeaderTitleText = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: white;
	margin: 0;
`;

const DragHandle = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 100%;
	cursor: grab;
	border-radius: 1rem 1rem 0 0;
	background: transparent;
	z-index: 1;

	&:active {
		cursor: grabbing;
	}
`;

const ModalPresentationService: React.FC<ModalPresentationServiceProps> = ({
	isOpen,
	onClose,
	title,
	description,
	actions,
 	children,
	style,
	draggable = true,
	showCloseButton = true,
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	const handleDragStart = useCallback((e: React.MouseEvent) => {
		if (!draggable || !dialogRef.current) return;
		// Don't start drag if clicking on buttons
		if ((e.target as HTMLElement).closest('button')) return;
		
		e.preventDefault();
		setIsDragging(true);
		
		const rect = dialogRef.current.getBoundingClientRect();
		setDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
		
		// Initialize position if not set
		if (!position) {
			const centerX = (window.innerWidth - rect.width) / 2;
			const centerY = (window.innerHeight - rect.height) / 2;
			setPosition({ x: centerX, y: centerY });
		}
	}, [draggable, position]);

	const handleDragMove = useCallback((e: MouseEvent) => {
		if (!isDragging || !draggable || !position) return;
		
		e.preventDefault();
		const newX = e.clientX - dragOffset.x;
		const newY = e.clientY - dragOffset.y;
		
		// Keep modal within viewport bounds
		const maxX = window.innerWidth - (dialogRef.current?.offsetWidth || 520);
		const maxY = window.innerHeight - (dialogRef.current?.offsetHeight || 400);
		
		setPosition({
			x: Math.max(0, Math.min(newX, maxX)),
			y: Math.max(0, Math.min(newY, maxY))
		});
	}, [isDragging, draggable, dragOffset, position]);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	React.useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleDragMove);
			document.addEventListener('mouseup', handleDragEnd);
			return () => {
				document.removeEventListener('mousemove', handleDragMove);
				document.removeEventListener('mouseup', handleDragEnd);
			};
		}
	}, [isDragging, handleDragMove, handleDragEnd]);

	// Center modal when it opens
	React.useEffect(() => {
		if (isOpen && !position && dialogRef.current) {
			const rect = dialogRef.current.getBoundingClientRect();
			const centerX = (window.innerWidth - rect.width) / 2;
			const centerY = (window.innerHeight - rect.height) / 2;
			setPosition({ x: centerX, y: centerY });
		}
		if (!isOpen) {
			setPosition(null);
			setIsDragging(false);
		}
	}, [isOpen, position]);

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
			<Dialog 
				ref={dialogRef}
				$isDragging={isDragging}
				$position={position || undefined}
				style={{
					...style,
					...(draggable && position && {
						position: 'fixed',
						left: `${position.x}px`,
						top: `${position.y}px`,
					}),
				}}
			>
				{draggable && (
					<ModalHeader 
						$isDragging={isDragging}
						onMouseDown={handleDragStart}
					>
						<HeaderTitle>
							<WarningIcon style={{ 
								width: '32px', 
								height: '32px', 
								margin: 0,
								background: 'rgba(255, 255, 255, 0.2)',
								color: 'white'
							}}>
								<FiAlertTriangle size={20} />
							</WarningIcon>
							<HeaderTitleText id="modal-title">{title}</HeaderTitleText>
						</HeaderTitle>
						{showCloseButton && (
							<CloseButton 
								onClick={onClose} 
								title="Close modal"
								style={{ 
									position: 'relative',
									top: 'auto',
									right: 'auto',
									background: 'rgba(255, 255, 255, 0.2)',
									color: 'white'
								}}
							>
								<FiX size={18} />
							</CloseButton>
						)}
					</ModalHeader>
				)}
				
				{!draggable && showCloseButton && (
					<CloseButton onClick={onClose} title="Close modal">
						<FiX size={16} />
					</CloseButton>
				)}
				
				<ModalBody>
					{!draggable && (
						<>
							<WarningIcon>
								<FiAlertTriangle size={28} />
							</WarningIcon>
							<Title id="modal-title">{title}</Title>
						</>
					)}
					<Description id="modal-description">{description}</Description>
					{children}
				</ModalBody>
				
				<Actions style={{ padding: '0 2.25rem 2.25rem 2.25rem', margin: 0 }}>
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
