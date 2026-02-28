/**
 * @file RefreshTokenTypeDropdownV8.tsx
 * @module v8/components
 * @description Dropdown for selecting refresh token type (JWT or Opaque)
 * @version 8.0.0
 * @since 2026-01-28
 *
 * Features:
 * - JWT (default) - Refresh tokens are JWTs
 * - Opaque - Refresh tokens are opaque references (more secure)
 * - Educational tooltips explaining each option
 * - Consistent styling with other V8 dropdowns
 *
 * @example
 * <RefreshTokenTypeDropdownV8
 *   value="JWT"
 *   onChange={(type) => setRefreshTokenType(type)}
 *   disabled={!enableRefreshToken}
 * />
 */

import React from 'react';
import { FiInfo } from '@icons';
import styled from 'styled-components';
import { TooltipV8 } from './TooltipV8';

const MODULE_TAG = '[🔄 REFRESH-TOKEN-TYPE-DROPDOWN-V8]';

export type RefreshTokenType = 'JWT' | 'OPAQUE';

interface RefreshTokenTypeDropdownV8Props {
	value: RefreshTokenType;
	onChange: (type: RefreshTokenType) => void;
	disabled?: boolean;
	className?: string;
}

const DropdownContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
`;

const Label = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 500;
	color: #2c3e50;
`;

const Select = styled.select<{ disabled?: boolean }>`
	width: 100%;
	padding: 10px 12px;
	font-size: 14px;
	border: 1px solid ${(props) => (props.disabled ? '#e0e0e0' : '#d1d5db')};
	border-radius: 6px;
	background-color: ${(props) => (props.disabled ? '#f5f5f5' : 'white')};
	color: ${(props) => (props.disabled ? '#9ca3af' : '#2c3e50')};
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		border-color: #3b82f6;
	}

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const InfoIcon = styled(FiInfo)`
	color: #6b7280;
	cursor: help;
	flex-shrink: 0;
`;

const OptionDescription = styled.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
	line-height: 1.4;
`;

/**
 * RefreshTokenTypeDropdownV8 - Dropdown for selecting refresh token type
 *
 * Allows users to choose between JWT and Opaque refresh tokens:
 * - JWT: Traditional JWT-based refresh tokens (default)
 * - Opaque: Opaque reference tokens (more secure, requires token introspection)
 *
 * @component
 */
export const RefreshTokenTypeDropdownV8: React.FC<RefreshTokenTypeDropdownV8Props> = ({
	value,
	onChange,
	disabled = false,
	className,
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = event.target.value as RefreshTokenType;
		console.log(`${MODULE_TAG} Refresh token type changed:`, {
			from: value,
			to: newValue,
		});
		onChange(newValue);
	};

	const tooltipContent = (
		<div>
			<strong>Refresh Token Type</strong>
			<br />
			<br />
			<strong>JWT (Default):</strong>
			<br />
			Refresh tokens are JSON Web Tokens (JWTs) that contain claims and can be validated locally.
			<br />
			<br />
			<strong>Opaque:</strong>
			<br />
			Refresh tokens are opaque references that must be validated by the authorization server. More
			secure as token contents cannot be inspected, but requires token introspection endpoint.
			<br />
			<br />
			<em>Note: Opaque tokens are recommended for enhanced security in production environments.</em>
		</div>
	);

	const getDescription = () => {
		if (disabled) {
			return 'Enable refresh tokens to configure token type';
		}
		switch (value) {
			case 'JWT':
				return 'JWT-based refresh tokens (default) - can be validated locally';
			case 'OPAQUE':
				return 'Opaque refresh tokens - more secure, requires introspection';
			default:
				return '';
		}
	};

	return (
		<DropdownContainer className={className}>
			<Label>
				Refresh Token Type
				<TooltipV8 content={tooltipContent} position="right">
					<InfoIcon size={16} />
				</TooltipV8>
			</Label>
			<Select value={value} onChange={handleChange} disabled={disabled}>
				<option value="JWT">JWT (Default)</option>
				<option value="OPAQUE">Opaque (More Secure)</option>
			</Select>
			<OptionDescription>{getDescription()}</OptionDescription>
		</DropdownContainer>
	);
};
