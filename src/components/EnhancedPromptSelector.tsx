// src/components/EnhancedPromptSelector.tsx
// Enhanced OIDC Prompt Parameter Selector with multiple values

import { FiCheck, FiInfo, FiShield, FiUser, FiUsers } from '@icons';
import React from 'react';
import styled from 'styled-components';

export type PromptValue = 'none' | 'login' | 'consent' | 'select_account';

interface EnhancedPromptSelectorProps {
	value: PromptValue[];
	onChange: (prompts: PromptValue[]) => void;
	disabled?: boolean;
}

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.75rem;
`;

const LabelIcon = styled.div`
	color: #059669;
	font-size: 1rem;
`;

const PromptGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const PromptOption = styled.button<{ $selected: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 2px solid ${(props) => (props.$selected ? '#059669' : '#e5e7eb')};
	background-color: ${(props) => (props.$selected ? '#f0fdf4' : '#ffffff')};
	color: ${(props) => (props.$selected ? '#065f46' : '#374151')};
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	text-align: left;

	&:hover {
		border-color: #059669;
		background-color: ${(props) => (props.$selected ? '#f0fdf4' : '#f9fafb')};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const PromptIcon = styled.div<{ $selected: boolean }>`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${(props) => (props.$selected ? '#059669' : '#6b7280')};
`;

const PromptContent = styled.div`
	flex: 1;
`;

const PromptTitle = styled.div`
	font-weight: 600;
	font-size: 0.875rem;
	margin-bottom: 0.25rem;
`;

const PromptDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`;

const SelectedIndicator = styled.div<{ $selected: boolean }>`
	opacity: ${(props) => (props.$selected ? 1 : 0)};
	color: #059669;
	font-size: 1rem;
`;

const InfoBox = styled.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: #065f46;
	line-height: 1.5;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: #059669;
`;

const HelperText = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	margin-bottom: 0.75rem;
	line-height: 1.5;
`;

const promptOptions: {
	value: PromptValue;
	title: string;
	description: string;
	icon: React.ElementType;
}[] = [
	{
		value: 'none',
		title: 'None',
		description: 'Do not prompt for authentication or consent',
		icon: FiShield,
	},
	{
		value: 'login',
		title: 'Login',
		description: 'Force user to authenticate, even if already logged in',
		icon: FiUser,
	},
	{
		value: 'consent',
		title: 'Consent',
		description: 'Force user to consent, even if previously granted',
		icon: FiCheck,
	},
	{
		value: 'select_account',
		title: 'Select Account',
		description: 'Show account selection screen to user',
		icon: FiUsers,
	},
];

export const EnhancedPromptSelector: React.FC<EnhancedPromptSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	const togglePrompt = (prompt: PromptValue) => {
		if (disabled) return;

		if (value.includes(prompt)) {
			// Remove if already selected
			onChange(value.filter((p) => p !== prompt));
		} else {
			// Add if not selected
			onChange([...value, prompt]);
		}
	};

	const formatValue = (prompts: PromptValue[]): string => {
		if (prompts.length === 0) return 'none';
		return prompts.join(' ');
	};

	return (
		<Container>
			<Label>
				<LabelIcon>
					<FiUser />
				</LabelIcon>
				Prompt Parameter (OIDC Authentication Behavior)
			</Label>

			<HelperText>
				The <code>prompt</code> parameter controls the authentication and consent behavior. You can
				select multiple values to combine behaviors (e.g., "login consent").
			</HelperText>

			<PromptGrid>
				{promptOptions.map((option) => {
					const Icon = option.icon;
					const isSelected = value.includes(option.value);

					return (
						<PromptOption
							key={option.value}
							$selected={isSelected}
							onClick={() => togglePrompt(option.value)}
							disabled={disabled}
							type="button"
						>
							<PromptIcon $selected={isSelected}>
								<Icon size={20} />
							</PromptIcon>
							<PromptContent>
								<PromptTitle>{option.title}</PromptTitle>
								<PromptDescription>{option.description}</PromptDescription>
							</PromptContent>
							<SelectedIndicator $selected={isSelected}>
								<FiCheck size={20} />
							</SelectedIndicator>
						</PromptOption>
					);
				})}
			</PromptGrid>

			<InfoBox>
				<InfoIcon>
					<FiInfo />
				</InfoIcon>
				<div>
					<strong>Current Value:</strong> <code>{formatValue(value)}</code>
					<div style={{ marginTop: '0.5rem' }}>
						<strong>About Multiple Prompts:</strong> You can combine multiple prompt values with
						spaces (e.g., "login consent"). The authorization server will process them in order.
						Common combinations:
					</div>
					<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
						<li>
							<code>login</code> - Force fresh authentication
						</li>
						<li>
							<code>consent</code> - Force fresh consent
						</li>
						<li>
							<code>login consent</code> - Force both fresh auth and consent
						</li>
						<li>
							<code>select_account</code> - Show account picker
						</li>
						<li>
							<code>none</code> - Skip all prompts (default)
						</li>
					</ul>
					<div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontStyle: 'italic' }}>
						💡 <strong>Note:</strong> Some combinations may not be supported by all authorization
						servers. Check your provider's documentation.
					</div>
				</div>
			</InfoBox>
		</Container>
	);
};

export default EnhancedPromptSelector;
