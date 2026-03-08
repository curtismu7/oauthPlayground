// src/components/ClientAuthMethodSelector.tsx
// Token Endpoint Authentication Method Selector for OAuth/OIDC flows


import React from 'react';
import styled from 'styled-components';
import { ClientAuthMethod, getAuthMethodSecurityLevel } from '../utils/clientAuthentication';

export interface ClientAuthMethodSelectorProps {
	value: ClientAuthMethod;
	onChange: (method: ClientAuthMethod) => void;
	allowedMethods?: ClientAuthMethod[];
	disabled?: boolean;
	showDescription?: boolean;
}

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.5rem;
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background-color: V9_COLORS.TEXT.WHITE;
	cursor: pointer;
	transition: all 0.2s ease-in-out;

	&:hover:not(:disabled) {
		border-color: V9_COLORS.TEXT.GRAY_LIGHT;
	}

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background-color: #f3f4f6;
		cursor: not-allowed;
		opacity: 0.6;
	}
`;

const Description = styled.div<{ $level: string }>`
	margin-top: 0.5rem;
	padding: 0.75rem;
	background-color: ${(props) => {
		switch (props.$level) {
			case 'Highest':
				return 'V9_COLORS.BG.SUCCESS';
			case 'High':
				return 'V9_COLORS.BG.GRAY_LIGHT';
			case 'Medium':
				return 'V9_COLORS.BG.WARNING';
			case 'Low':
				return 'V9_COLORS.BG.ERROR';
			default:
				return '#f3f4f6';
		}
	}};
	border-left: 3px solid ${(props) => {
		switch (props.$level) {
			case 'Highest':
				return 'V9_COLORS.PRIMARY.GREEN';
			case 'High':
				return 'V9_COLORS.PRIMARY.BLUE';
			case 'Medium':
				return 'V9_COLORS.PRIMARY.YELLOW';
			case 'Low':
				return 'V9_COLORS.PRIMARY.RED';
			default:
				return 'V9_COLORS.TEXT.GRAY_LIGHT';
		}
	}};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	line-height: 1.5;
	color: #4b5563;
`;

const SecurityBadge = styled.span<{ $level: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.6875rem;
	font-weight: 600;
	background-color: ${(props) => {
		switch (props.$level) {
			case 'Highest':
				return 'V9_COLORS.PRIMARY.GREEN';
			case 'High':
				return 'V9_COLORS.PRIMARY.BLUE';
			case 'Medium':
				return 'V9_COLORS.PRIMARY.YELLOW';
			case 'Low':
				return 'V9_COLORS.PRIMARY.RED';
			default:
				return 'V9_COLORS.TEXT.GRAY_LIGHT';
		}
	}};
	color: V9_COLORS.TEXT.WHITE;
`;

const HelperText = styled.div`
	margin-top: 0.375rem;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	display: flex;
	align-items: start;
	gap: 0.375rem;

	svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
`;

const ALL_METHODS: ClientAuthMethod[] = [
	'none',
	'client_secret_basic',
	'client_secret_post',
	'client_secret_jwt',
	'private_key_jwt',
];

const METHOD_LABELS: Record<ClientAuthMethod, string> = {
	none: 'None (Public Client)',
	client_secret_basic: 'Client Secret Basic',
	client_secret_post: 'Client Secret Post',
	client_secret_jwt: 'Client Secret JWT',
	private_key_jwt: 'Private Key JWT',
};

const ClientAuthMethodSelector: React.FC<ClientAuthMethodSelectorProps> = ({
	value,
	onChange,
	allowedMethods = ALL_METHODS,
	disabled = false,
	showDescription = true,
}) => {
	const securityInfo = getAuthMethodSecurityLevel(value);

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value as ClientAuthMethod);
	};

	return (
		<Container>
			<Label>
				<span>🛡️</span>
				Token Endpoint Authentication Method
			</Label>

			<Select value={value} onChange={handleChange} disabled={disabled}>
				{allowedMethods.map((method) => (
					<option key={method} value={method}>
						{METHOD_LABELS[method]}
					</option>
				))}
			</Select>

			{showDescription && securityInfo && (
				<Description $level={securityInfo.level}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							marginBottom: '0.375rem',
						}}
					>
						<SecurityBadge $level={securityInfo.level}>
							{securityInfo.icon} {securityInfo.level} Security
						</SecurityBadge>
					</div>
					<div>{securityInfo.description}</div>
				</Description>
			)}

			<HelperText>
				<span>ℹ️</span>
				<span>
					Specifies how the client authenticates with the token endpoint. Public clients (SPAs,
					mobile apps) use "None". Confidential clients use secret or JWT-based methods.
				</span>
			</HelperText>
		</Container>
	);
};

export default ClientAuthMethodSelector;
