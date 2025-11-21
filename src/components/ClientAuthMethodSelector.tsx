// src/components/ClientAuthMethodSelector.tsx
// Token Endpoint Authentication Method Selector for OAuth/OIDC flows

import React from 'react';
import { FiInfo, FiShield } from 'react-icons/fi';
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
	color: #374151;
	margin-bottom: 0.5rem;
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background-color: #ffffff;
	cursor: pointer;
	transition: all 0.2s ease-in-out;

	&:hover:not(:disabled) {
		border-color: #9ca3af;
	}

	&:focus {
		outline: none;
		border-color: #3b82f6;
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
				return '#ecfdf5';
			case 'High':
				return '#eff6ff';
			case 'Medium':
				return '#fffbeb';
			case 'Low':
				return '#fef2f2';
			default:
				return '#f3f4f6';
		}
	}};
	border-left: 3px solid ${(props) => {
		switch (props.$level) {
			case 'Highest':
				return '#10b981';
			case 'High':
				return '#3b82f6';
			case 'Medium':
				return '#f59e0b';
			case 'Low':
				return '#ef4444';
			default:
				return '#9ca3af';
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
				return '#10b981';
			case 'High':
				return '#3b82f6';
			case 'Medium':
				return '#f59e0b';
			case 'Low':
				return '#ef4444';
			default:
				return '#9ca3af';
		}
	}};
	color: #ffffff;
`;

const HelperText = styled.div`
	margin-top: 0.375rem;
	font-size: 0.75rem;
	color: #6b7280;
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
				<FiShield />
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
				<FiInfo />
				<span>
					Specifies how the client authenticates with the token endpoint. Public clients (SPAs,
					mobile apps) use "None". Confidential clients use secret or JWT-based methods.
				</span>
			</HelperText>
		</Container>
	);
};

export default ClientAuthMethodSelector;
