// src/components/password-reset/shared/PasswordResetSharedComponents.tsx
// Shared styled components for password reset tabs

import styled from 'styled-components';
import { FiBook, FiExternalLink } from '../../../services/commonImportsService';

export const Card = styled.div`
	background: #ffffff;
	border: 1px solid #E5E7EB;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const Alert = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	background: ${(props) => {
		if (props.$type === 'success') return '#F0FDF4';
		if (props.$type === 'error') return '#FEF2F2';
		return '#EFF6FF';
	}};
	border: 1px solid ${(props) => {
		if (props.$type === 'success') return '#22C55E';
		if (props.$type === 'error') return '#DC2626';
		return '#3B82F6';
	}};
	color: ${(props) => {
		if (props.$type === 'success') return '#166534';
		if (props.$type === 'error') return '#991B1B';
		return '#1E40AF';
	}};
`;

export const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

export const Label = styled.label`
	display: block;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

export const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #D1D5DB;
	border-radius: 0.5rem;
	font-size: 1rem;
	background: #ffffff;
	color: #1F2937;
	
	&:focus {
		outline: none;
		border-color: #F59E0B;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}
	
	&::placeholder {
		color: #9CA3AF;
	}
`;

export const Button = styled.button<{
	$variant?: 'primary' | 'secondary' | 'success' | 'danger';
	$size?: 'compact' | 'regular';
}>`
	display: inline-flex;
	align-items: center;
	gap: ${({ $size }) => ($size === 'compact' ? '0.35rem' : '0.5rem')};
	padding: ${({ $size }) => ($size === 'compact' ? '0.5rem 1rem' : '0.75rem 1.5rem')};
	border: none;
	border-radius: ${({ $size }) => ($size === 'compact' ? '0.4rem' : '0.5rem')};
	font-size: ${({ $size }) => ($size === 'compact' ? '0.9rem' : '1rem')};
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	
	${(props) => {
		if (props.$variant === 'secondary') {
			return `
				background: #F3F4F6;
				color: #374151;
				&:hover {
					background: #E5E7EB;
				}
			`;
		}
		if (props.$variant === 'success') {
			return `
				background: #22C55E;
				color: white;
				&:hover {
					background: #16A34A;
				}
			`;
		}
		if (props.$variant === 'danger') {
			return `
				background: #DC2626;
				color: white;
				&:hover {
					background: #B91C1C;
				}
			`;
		}
		return `
			background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%);
			color: white;
			&:hover {
				opacity: 0.9;
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
			}
		`;
	}}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

export const UserCard = styled.div`
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

export const UserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

export const UserAvatar = styled.div`
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 700;
	font-size: 1.25rem;
`;

export const DocumentationSection = styled.div`
	margin-top: 1.5rem;
	padding-top: 1.5rem;
	border-top: 1px solid #E5E7EB;
`;

export const DocumentationLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: #3B82F6;
	text-decoration: none;
	font-size: 0.875rem;
	padding: 0.5rem 1rem;
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
	
	&:hover {
		background: #F3F4F6;
		border-color: #D1D5DB;
	}
`;

export const SuccessMessage = styled.div`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	padding: 2rem;
	border-radius: 1rem;
	text-align: center;
	margin: 2rem 0;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
`;

export const SuccessTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
`;

export const SuccessText = styled.p`
	font-size: 1rem;
	opacity: 0.95;
	margin: 0;
`;

export const SpinningIcon = styled.div`
	display: inline-block;
	width: 1rem;
	height: 1rem;
	border: 2px solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 0.6s linear infinite;
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

// Documentation link component with icon
export const DocumentationLinkWithIcon: React.FC<{ href: string; children: React.ReactNode }> = ({
	href,
	children,
}) => (
	<DocumentationSection>
		<DocumentationLink href={href} target="_blank" rel="noopener noreferrer">
			<FiBook />
			{children}
			<FiExternalLink size={14} />
		</DocumentationLink>
	</DocumentationSection>
);
