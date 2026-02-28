// src/components/DisplayParameterSelector.tsx
// OIDC Display Parameter Selector - Controls UI presentation mode
import React from 'react';
import { FiInfo, FiLayout, FiMonitor, FiSmartphone } from '@icons';
import styled from 'styled-components';

export type DisplayMode = 'page' | 'popup' | 'touch' | 'wap';

interface DisplayParameterSelectorProps {
	value: DisplayMode;
	onChange: (value: DisplayMode) => void;
	disabled?: boolean;
}

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const DisplayGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`;

const DisplayOption = styled.button<{ $selected: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	border: 2px solid ${(props) => (props.$selected ? '#10b981' : '#e5e7eb')};
	border-radius: 0.5rem;
	background: ${(props) => (props.$selected ? '#f0fdf4' : '#ffffff')};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: ${(props) => (props.$selected ? '#10b981' : '#d1d5db')};
		background: ${(props) => (props.$selected ? '#f0fdf4' : '#f9fafb')};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const DisplayIcon = styled.div<{ $selected: boolean }>`
	font-size: 2rem;
	color: ${(props) => (props.$selected ? '#10b981' : '#6b7280')};
`;

const DisplayTitle = styled.div<{ $selected: boolean }>`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${(props) => (props.$selected ? '#065f46' : '#374151')};
`;

const DisplayDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	text-align: center;
	line-height: 1.4;
`;

const InfoBox = styled.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #1e40af;
	line-height: 1.5;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: #3b82f6;
`;

const displayModes: Array<{
	value: DisplayMode;
	icon: React.ComponentType;
	title: string;
	description: string;
}> = [
	{
		value: 'page',
		icon: FiMonitor,
		title: 'Page (Default)',
		description: 'Full page user agent - Standard desktop/mobile browser',
	},
	{
		value: 'popup',
		icon: FiLayout,
		title: 'Popup',
		description: 'Popup window - Smaller browser window for authentication',
	},
	{
		value: 'touch',
		icon: FiSmartphone,
		title: 'Touch',
		description: 'Touch-based device - Optimized for touchscreens and tablets',
	},
	{
		value: 'wap',
		icon: FiSmartphone,
		title: 'WAP',
		description: 'WAP-based mobile - Legacy mobile devices (rarely used today)',
	},
];

export const DisplayParameterSelector: React.FC<DisplayParameterSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	return (
		<Container>
			<Label>Display Mode (OIDC UI Adaptation)</Label>

			<DisplayGrid>
				{displayModes.map((mode) => {
					const Icon = mode.icon;
					const isSelected = value === mode.value;

					return (
						<DisplayOption
							key={mode.value}
							type="button"
							$selected={isSelected}
							onClick={() => onChange(mode.value)}
							disabled={disabled}
						>
							<DisplayIcon $selected={isSelected}>
								<Icon />
							</DisplayIcon>
							<DisplayTitle $selected={isSelected}>{mode.title}</DisplayTitle>
							<DisplayDescription>{mode.description}</DisplayDescription>
						</DisplayOption>
					);
				})}
			</DisplayGrid>

			<InfoBox>
				<InfoIcon>
					<FiInfo />
				</InfoIcon>
				<div>
					<strong>About Display Parameter:</strong> The <code>display</code> parameter tells the
					Authorization Server how to present the authentication UI. Different display modes
					optimize the experience for different device types and contexts. Most applications use{' '}
					<code>page</code> (default) or <code>popup</code>.
					<div style={{ marginTop: '0.5rem' }}>
						<strong>Note:</strong> Not all providers support all display modes. PingOne primarily
						supports
						<code>page</code> and <code>popup</code> modes.
					</div>
				</div>
			</InfoBox>
		</Container>
	);
};

export default DisplayParameterSelector;
