// src/components/DeviceTypeSelector.tsx
// Device Type Dropdown Selector Component

import React from 'react';
import styled from 'styled-components';
import { deviceTypeService, DeviceTypeConfig } from '../services/deviceTypeService';

const SelectorContainer = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 600;
	font-size: 0.875rem;
	color: #1e293b;
	margin-bottom: 0.5rem;
`;

const SelectWrapper = styled.div`
	position: relative;
	display: inline-block;
	width: 100%;
`;

const Select = styled.select<{ $color: string }>`
	width: 100%;
	padding: 0.75rem 2.5rem 0.75rem 1rem;
	font-size: 1rem;
	font-weight: 500;
	color: #1e293b;
	background: white;
	border: 2px solid ${props => props.$color || '#e2e8f0'};
	border-radius: 0.5rem;
	cursor: pointer;
	appearance: none;
	transition: all 0.2s;
	
	&:hover {
		border-color: ${props => props.$color || '#cbd5e1'};
		box-shadow: 0 0 0 3px ${props => props.$color + '20' || '#cbd5e120'};
	}
	
	&:focus {
		outline: none;
		border-color: ${props => props.$color || '#3b82f6'};
		box-shadow: 0 0 0 3px ${props => props.$color + '30' || '#3b82f630'};
	}
`;

const SelectIcon = styled.div`
	position: absolute;
	right: 1rem;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: none;
	font-size: 0.875rem;
	color: #64748b;
`;

const DeviceInfo = styled.div`
	margin-top: 0.75rem;
	padding: 0.75rem 1rem;
	background: #f8fafc;
	border-left: 3px solid ${props => props.color || '#3b82f6'};
	border-radius: 0.375rem;
`;

const DeviceDescription = styled.div`
	font-size: 0.875rem;
	color: #64748b;
	margin-bottom: 0.5rem;
`;

const DeviceUseCase = styled.div`
	font-size: 0.75rem;
	color: #94a3b8;
	font-style: italic;
`;

export interface DeviceTypeSelectorProps {
	value: string;
	onChange: (deviceId: string) => void;
	label?: string;
	showInfo?: boolean;
}

/**
 * Device Type Selector Component
 * Provides a dropdown to select different device scenarios
 */
export const DeviceTypeSelector: React.FC<DeviceTypeSelectorProps> = ({
	value,
	onChange,
	label = 'Select Device Type',
	showInfo = true
}) => {
	const options = deviceTypeService.getDeviceTypeOptions();
	const selectedDevice = deviceTypeService.getDeviceType(value);

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value);
	};

	return (
		<SelectorContainer>
			<Label>{label}</Label>
			<SelectWrapper>
				<Select
					value={value}
					onChange={handleChange}
					$color={selectedDevice.color}
				>
					{options.map(option => (
						<option key={option.value} value={option.value}>
							{option.emoji} {option.label}
						</option>
					))}
				</Select>
				<SelectIcon>▼</SelectIcon>
			</SelectWrapper>
			
			{showInfo && (
				<DeviceInfo color={selectedDevice.color}>
					<DeviceDescription>
						<strong>{selectedDevice.scenario}:</strong> {selectedDevice.description}
					</DeviceDescription>
					<DeviceUseCase>
						💡 {selectedDevice.useCase}
					</DeviceUseCase>
				</DeviceInfo>
			)}
		</SelectorContainer>
	);
};

export default DeviceTypeSelector;

