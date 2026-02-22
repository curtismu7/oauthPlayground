/**
 * @file DomainConfiguration.tsx
 * @module components
 * @description Domain configuration component for custom domain setup
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiGlobe,
	FiInfo,
	FiRefreshCw,
	FiSave,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useDomainConfiguration } from '@/hooks/useDomainConfiguration';

// Styled components
const Container = styled.div`
	background: white;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`;

const Description = styled.p`
	margin: 0 0 1.5rem 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const Form = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
	padding: 0.75rem;
	border: 1px solid ${(props) => (props.$hasError ? '#ef4444' : '#d1d5db')};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
	}
`;

const ToggleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
`;

const Toggle = styled.label`
	position: relative;
	display: inline-block;
	width: 48px;
	height: 24px;
`;

const ToggleInput = styled.input`
	opacity: 0;
	width: 0;
	height: 0;

	&:checked + span {
		background-color: #3b82f6;
	}

	&:checked + span:before {
		transform: translateX(24px);
	}
`;

const ToggleSlider = styled.span`
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #cbd5e1;
	transition: 0.3s;
	border-radius: 24px;

	&:before {
		position: absolute;
		content: '';
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid;

	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background-color: #3b82f6;
					color: white;
					border-color: #3b82f6;
					&:hover:not(:disabled) {
						background-color: #2563eb;
					}
				`;
			case 'danger':
				return `
					background-color: #ef4444;
					color: white;
					border-color: #ef4444;
					&:hover:not(:disabled) {
						background-color: #dc2626;
					}
				`;
			default:
				return `
					background-color: white;
					color: #374151;
					border-color: #d1d5db;
					&:hover:not(:disabled) {
						background-color: #f9fafb;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const StatusCard = styled.div<{ $type: 'success' | 'warning' | 'error' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-top: 1rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;

	${(props) => {
		switch (props.$type) {
			case 'success':
				return `
					background-color: #f0fdf4;
					border: 1px solid #bbf7d0;
					color: #166534;
				`;
			case 'warning':
				return `
					background-color: #fffbeb;
					border: 1px solid #fed7aa;
					color: #92400e;
				`;
			case 'error':
				return `
					background-color: #fef2f2;
					border: 1px solid #fecaca;
					color: #991b1b;
				`;
		}
	}}
`;

const CurrentDomainInfo = styled.div`
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
	margin-bottom: 1rem;
`;

const DomainRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;

	&:not(:last-child) {
		border-bottom: 1px solid #e2e8f0;
	}
`;

const DomainLabel = styled.span`
	font-weight: 500;
	color: #374151;
`;

const DomainValue = styled.span`
	color: #6b7280;
	font-family: monospace;
	font-size: 0.875rem;
`;

/**
 * Domain Configuration Component
 *
 * Provides UI for configuring custom domains for the OAuth application.
 * Includes validation, testing, and status display functionality.
 */
export const DomainConfiguration: React.FC = () => {
	const {
		config,
		isLoading,
		error,
		effectiveDomain,
		isCustomDomainActive,
		setCustomDomain,
		toggleCustomDomain,
		resetToDefault,
		clearError,
	} = useDomainConfiguration();

	const [customDomainInput, setCustomDomainInput] = useState(config.customDomain || '');
	const [isValidating, setIsValidating] = useState(false);

	const handleSaveDomain = async () => {
		if (!customDomainInput.trim()) {
			return;
		}

		setIsValidating(true);
		clearError();

		try {
			await setCustomDomain(customDomainInput.trim());
		} catch {
			// Error is handled by the hook
		} finally {
			setIsValidating(false);
		}
	};

	const handleToggleCustomDomain = async (enabled: boolean) => {
		clearError();
		await toggleCustomDomain(enabled);
	};

	const handleReset = async () => {
		clearError();
		await resetToDefault();
		setCustomDomainInput('');
	};

	const getStatusType = (): 'success' | 'warning' | 'error' => {
		if (error) return 'error';
		if (isCustomDomainActive) return 'success';
		return 'warning';
	};

	const getStatusMessage = () => {
		if (error) return error;
		if (isCustomDomainActive) return 'Custom domain is active and configured';
		return 'Using default domain (localhost). Configure a custom domain for production use.';
	};

	const getStatusIcon = () => {
		if (error) return <FiAlertTriangle />;
		if (isCustomDomainActive) return <FiCheckCircle />;
		return <FiInfo />;
	};

	return (
		<Container>
			<Header>
				<FiGlobe size={24} color="#3b82f6" />
				<Title>Domain Configuration</Title>
			</Header>

			<Description>
				Configure a custom domain for your OAuth application. This allows you to use domains like
				auth.curtis.com instead of localhost for production deployments.
			</Description>

			<CurrentDomainInfo>
				<DomainRow>
					<DomainLabel>Current Domain:</DomainLabel>
					<DomainValue>{effectiveDomain}</DomainValue>
				</DomainRow>
				<DomainRow>
					<DomainLabel>Custom Domain Active:</DomainLabel>
					<DomainValue>{isCustomDomainActive ? 'Yes' : 'No'}</DomainValue>
				</DomainRow>
				{config.customDomain && (
					<DomainRow>
						<DomainLabel>Configured Domain:</DomainLabel>
						<DomainValue>{config.customDomain}</DomainValue>
					</DomainRow>
				)}
			</CurrentDomainInfo>

			<Form>
				<ToggleContainer>
					<Toggle>
						<ToggleInput
							type="checkbox"
							checked={config.useCustomDomain}
							onChange={(e) => handleToggleCustomDomain(e.target.checked)}
							disabled={isLoading}
						/>
						<ToggleSlider />
					</Toggle>
					<span>Use custom domain</span>
				</ToggleContainer>

				{config.useCustomDomain && (
					<FormGroup>
						<Label htmlFor="custom-domain">Custom Domain URL</Label>
						<Input
							id="custom-domain"
							type="url"
							value={customDomainInput}
							onChange={(e) => setCustomDomainInput(e.target.value)}
							placeholder="https://auth.curtis.com"
							$hasError={!!error}
							disabled={isLoading}
						/>
					</FormGroup>
				)}
			</Form>

			{config.useCustomDomain && (
				<ButtonGroup>
					<Button
						$variant="primary"
						onClick={handleSaveDomain}
						disabled={isLoading || isValidating || !customDomainInput.trim()}
					>
						{isLoading || isValidating ? (
							<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
						) : (
							<FiSave />
						)}
						{isLoading || isValidating ? 'Saving...' : 'Save Domain'}
					</Button>
					<Button onClick={handleReset} disabled={isLoading} $variant="danger">
						<FiTrash2 />
						Reset to Default
					</Button>
				</ButtonGroup>
			)}

			<StatusCard $type={getStatusType()}>
				{getStatusIcon()}
				<span>{getStatusMessage()}</span>
			</StatusCard>
		</Container>
	);
};

export default DomainConfiguration;
