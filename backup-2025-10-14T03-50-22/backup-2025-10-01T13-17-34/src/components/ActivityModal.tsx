import { styled } from 'styled-components';

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: var(--modal-overlay, rgba(0, 0, 0, 0.5));
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ModalContent = styled.div`
	background: var(--color-background);
	border-radius: var(--border-radius-lg);
	width: 90%;
	max-width: 600px;
	max-height: 80vh;
	overflow: hidden;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	border: 1px solid var(--color-border);
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.5rem 2rem;
	border-bottom: 1px solid var(--color-border);
	background: var(--color-primary);
	color: var(--color-text-primary);
`;

const ModalTitle = styled.h2`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: var(--font-size-xl);
	font-weight: 600;
	margin: 0;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: var(--color-text-primary);
	cursor: pointer;
	padding: 0.5rem;
	border-radius: var(--border-radius-sm);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}
`;

const ModalBody = styled.div`
	padding: 1.5rem 2rem;
	max-height: 60vh;
	overflow-y: auto;
	background: var(--color-background);
`;
